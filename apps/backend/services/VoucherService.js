import { query, withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

function calculateMemberLevel(points) {
    if (points >= 2000) return 'Platinum';
    if (points >= 1000) return 'Gold';
    return 'Silver';
}

function normalizeText(value) {
    return String(value || '').trim();
}

async function syncMemberLevelFromUserPoints(connection, userId) {
    const [rows] = await connection.query(
        `SELECT total_points FROM user_points WHERE user_id = ? LIMIT 1`,
        [userId]
    );
    const totalPoints = Number(rows?.[0]?.total_points || 0);
    const level = calculateMemberLevel(totalPoints);

    await connection.query(
        `UPDATE users SET membership_level = ? WHERE user_id = ?`,
        [level, userId]
    );

    await connection.query(
        `UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?`,
        [level, userId]
    );
}

export class VoucherService {
    static async getAllVouchers() {
        const rows = await query(
            'SELECT voucher_code, voucher_name, voucher_type, points_cost, value_amount, description, stock, expiry_days, image_url, max_discount, min_purchase, cashier_instruction, is_active, created_at FROM vouchers WHERE is_active = 1 ORDER BY created_at DESC'
        );
        return rows.map((row) => ({
            voucherCode: row.voucher_code,
            voucherName: row.voucher_name,
            voucherType: row.voucher_type,
            pointsCost: Number(row.points_cost || 0),
            valueAmount: Number(row.value_amount || 0),
            description: row.description || '',
            stock: Number(row.stock || 0),
            expiryDays: row.expiry_days,
            imageUrl: row.image_url || '',
            maxDiscount: row.max_discount !== null ? Number(row.max_discount) : null,
            minPurchase: row.min_purchase !== null ? Number(row.min_purchase) : null,
            cashierInstruction: row.cashier_instruction || '',
            isActive: Boolean(row.is_active),
            createdAt: row.created_at,
        }));
    }

    static async getVoucherByCode(voucherCode) {
        const rows = await query(
            'SELECT voucher_code, voucher_name, voucher_type, points_cost, value_amount, description, stock, expiry_days, image_url, max_discount, min_purchase, cashier_instruction, is_active FROM vouchers WHERE voucher_code = ? LIMIT 1',
            [normalizeText(voucherCode)]
        );
        if (!rows[0]) return null;
        const row = rows[0];
        return {
            voucherCode: row.voucher_code,
            voucherName: row.voucher_name,
            voucherType: row.voucher_type,
            pointsCost: Number(row.points_cost || 0),
            valueAmount: Number(row.value_amount || 0),
            description: row.description || '',
            stock: Number(row.stock || 0),
            expiryDays: row.expiry_days,
            imageUrl: row.image_url || '',
            maxDiscount: row.max_discount !== null ? Number(row.max_discount) : null,
            minPurchase: row.min_purchase !== null ? Number(row.min_purchase) : null,
            cashierInstruction: row.cashier_instruction || '',
            isActive: Boolean(row.is_active),
            createdAt: row.created_at,
        };
    }

    static async claimVoucher(userId, voucherCode) {
        const voucher = await this.getVoucherByCode(voucherCode);

        if (!voucher) {
            throw new Error('Voucher tidak ditemukan.');
        }

        if (!voucher.isActive) {
            throw new Error('Voucher sedang tidak aktif.');
        }

        const pointsCost = Number(voucher.pointsCost || 0);

        return await withTransaction(async (connection) => {
            const queryWithConn = async (sql, params) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };

            const existingClaim = await queryWithConn(
                'SELECT id FROM user_voucher WHERE user_id = ? AND voucher_code = ? AND status = ? LIMIT 1',
                [userId, voucherCode, 'ACTIVE']
            );

            if (existingClaim && existingClaim.length > 0) {
                throw new Error('Voucher ini sudah ada di koleksi Anda. Gunakan voucher yang tersedia terlebih dahulu atau pilih voucher lainnya.');
            }

            const pointRows = await queryWithConn(
                'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            let currentPoints = 0;

            if (!pointRows || pointRows.length === 0) {
                await queryWithConn(
                    'INSERT INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) VALUES (?, 0, ?, 0, NULL)',
                    [userId, 'Silver']
                );
                const newPointRows = await queryWithConn(
                    'SELECT user_id, points FROM UserGamification WHERE user_id = ? FOR UPDATE',
                    [userId]
                );
                currentPoints = Number(newPointRows[0]?.points || 0);
            } else {
                currentPoints = Number(pointRows[0].points || 0);
            }

            if (currentPoints < pointsCost) {
                throw new Error('Poin user tidak mencukupi.');
            }

            const voucherStockRows = await queryWithConn(
                'SELECT stock FROM vouchers WHERE voucher_code = ? FOR UPDATE',
                [voucherCode]
            );

            const currentStock = Number(voucherStockRows[0]?.stock || 0);
            if (currentStock <= 0) {
                throw new Error('Voucher sudah habis. Silakan coba voucher lainnya atau tunggu stok tersedia kembali.');
            }

            const nextTotalPoints = currentPoints - pointsCost;

            const existingUserPoints = await queryWithConn(
                'SELECT user_id FROM user_points WHERE user_id = ? LIMIT 1',
                [userId]
            );

            if (!existingUserPoints || existingUserPoints.length === 0) {
                await queryWithConn(
                    'INSERT INTO user_points (user_id, total_points, poin_gamification, cashback_points, commission_points) VALUES (?, ?, ?, 0, 0)',
                    [userId, currentPoints, currentPoints]
                );
            }

            await queryWithConn(
                'UPDATE UserGamification SET points = ? WHERE user_id = ?',
                [nextTotalPoints, userId]
            );

            if (pointsCost > 0) {
                const [pointRows] = await connection.query(
                    `SELECT total_points, poin_gamification, cashback_points, commission_points
                     FROM user_points
                     WHERE user_id = ?`,
                    [userId]
                );

                const current = pointRows[0] || {};
                const nextGamification = Number(current.poin_gamification || 0) - pointsCost;
                const nextCashback = Number(current.cashback_points || 0);
                const nextCommission = Number(current.commission_points || 0);
                const nextTotalPoints = Number(current.total_points || 0) - pointsCost;

                await connection.query(
                    `UPDATE user_points
                     SET total_points = ?,
                         poin_gamification = ?,
                         cashback_points = ?,
                         commission_points = ?
                     WHERE user_id = ?`,
                    [nextTotalPoints, nextGamification, nextCashback, nextCommission, userId]
                );

                await connection.query(
                    `UPDATE users SET membership_level = ? WHERE user_id = ?`,
                    [calculateMemberLevel(nextTotalPoints), userId]
                );

                await connection.query(
                    `UPDATE UserGamification SET memberLevel = ? WHERE user_id = ?`,
                    [calculateMemberLevel(nextTotalPoints), userId]
                );
            } else {
                await syncMemberLevelFromUserPoints(connection, userId);
            }

            const redemptionId = generateId();
            await queryWithConn(
                'INSERT INTO redemption_logs (id, user_id, voucher_code, points_used, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [redemptionId, userId, voucher.voucherCode, pointsCost, 'COMPLETED']
            );

            try {
                const voucherClaimId = generateId();
                await queryWithConn(
                    'INSERT INTO user_voucher (id, user_id, voucher_code, claimed_at, status) VALUES (?, ?, ?, NOW(), ?)',
                    [voucherClaimId, userId, voucher.voucherCode, 'ACTIVE']
                );
            } catch (tableError) {
                console.warn('[VoucherService] user_voucher table may not exist:', tableError.message);
            }

            await queryWithConn(
                'INSERT INTO point_logs (user_id, point_type, points, reference_type, reference_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [userId, 'voucher', -pointsCost, 'voucher', voucher.voucherCode, 'Claim voucher: ' + voucher.voucherName]
            );

            await queryWithConn(
                'UPDATE vouchers SET stock = stock - 1 WHERE voucher_code = ? AND stock > 0',
                [voucherCode]
            );

            return {
                userId,
                voucherCode: voucher.voucherCode,
                voucherName: voucher.voucherName,
                voucherType: voucher.voucherType,
                pointsUsed: pointsCost,
                remainingPoints: nextTotalPoints,
                status: 'ACTIVE',
            };
        });
    }

    static async getAllVouchersAdmin() {
        const rows = await query(
            'SELECT voucher_code, voucher_name, voucher_type, points_cost, value_amount, description, stock, expiry_days, image_url, max_discount, min_purchase, cashier_instruction, is_active, created_at FROM vouchers ORDER BY created_at DESC'
        );
        return rows.map((row) => ({
            voucherCode: row.voucher_code,
            voucherName: row.voucher_name,
            voucherType: row.voucher_type,
            pointsCost: Number(row.points_cost || 0),
            valueAmount: Number(row.value_amount || 0),
            description: row.description || '',
            stock: Number(row.stock || 0),
            expiryDays: row.expiry_days,
            imageUrl: row.image_url || '',
            maxDiscount: row.max_discount !== null ? Number(row.max_discount) : null,
            minPurchase: row.min_purchase !== null ? Number(row.min_purchase) : null,
            cashierInstruction: row.cashier_instruction || '',
            isActive: Boolean(row.is_active),
            createdAt: row.created_at,
        }));
    }

    static async createVoucher(data) {
        const { voucher_code, voucher_name, voucher_type, points_cost, value_amount, description, stock, expiry_days, image_url, max_discount, min_purchase, cashier_instruction, is_active } = data;

        if (!voucher_code || !voucher_name || !voucher_type || points_cost === undefined) {
            throw new Error('voucher_code, voucher_name, voucher_type, dan points_cost wajib diisi.');
        }

        const existing = await query('SELECT voucher_code FROM vouchers WHERE voucher_code = ? LIMIT 1', [voucher_code]);
        if (existing.length > 0) {
            throw new Error('Voucher code sudah ada.');
        }

        await query(
            'INSERT INTO vouchers (voucher_code, voucher_name, voucher_type, points_cost, value_amount, description, stock, expiry_days, image_url, max_discount, min_purchase, cashier_instruction, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [voucher_code, voucher_name, voucher_type, points_cost, value_amount || 0, description || null, stock || 0, expiry_days || null, image_url || null, max_discount || null, min_purchase || null, cashier_instruction || null, is_active !== false ? 1 : 0]
        );

        return { voucherCode: voucher_code };
    }

    static async updateVoucher(voucherCode, data) {
        const { voucher_name, voucher_type, points_cost, value_amount, description, stock, expiry_days, image_url, max_discount, min_purchase, cashier_instruction, is_active } = data;

        const existing = await query('SELECT voucher_code FROM vouchers WHERE voucher_code = ? LIMIT 1', [voucherCode]);
        if (existing.length === 0) {
            throw new Error('Voucher tidak ditemukan.');
        }

        await query(
            'UPDATE vouchers SET voucher_name = ?, voucher_type = ?, points_cost = ?, value_amount = ?, description = ?, stock = ?, expiry_days = ?, image_url = ?, max_discount = ?, min_purchase = ?, cashier_instruction = ?, is_active = ? WHERE voucher_code = ?',
            [
                voucher_name,
                voucher_type,
                points_cost,
                value_amount || 0,
                description ?? null,
                stock ?? 0,
                expiry_days ?? null,
                image_url ?? null,
                max_discount || null,
                min_purchase || null,
                cashier_instruction || null,
                is_active !== false ? 1 : 0,
                voucherCode
            ]
        );

        return { voucherCode };
    }

    static async deleteVoucher(voucherCode) {
        const existing = await query('SELECT voucher_code FROM vouchers WHERE voucher_code = ? LIMIT 1', [voucherCode]);
        if (existing.length === 0) {
            throw new Error('Voucher tidak ditemukan.');
        }

        await query('DELETE FROM vouchers WHERE voucher_code = ?', [voucherCode]);
        return { voucherCode };
    }
}
