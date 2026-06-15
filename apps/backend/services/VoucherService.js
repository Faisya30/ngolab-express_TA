import { query, withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

function normalizeText(value) {
    return String(value || '').trim();
}

export class VoucherService {
    static async getAllVouchers() {
        const rows = await query(
            'SELECT voucher_code, voucher_name, voucher_type, points_cost, value_amount, is_active, created_at FROM vouchers WHERE is_active = 1 ORDER BY created_at DESC'
        );
        return rows.map((row) => ({
            voucherCode: row.voucher_code,
            voucherName: row.voucher_name,
            voucherType: row.voucher_type,
            pointsCost: Number(row.points_cost || 0),
            valueAmount: Number(row.value_amount || 0),
            isActive: Boolean(row.is_active),
            createdAt: row.created_at,
        }));
    }

    static async getVoucherByCode(voucherCode) {
        const rows = await query(
            'SELECT voucher_code, voucher_name, voucher_type, points_cost, value_amount, is_active FROM vouchers WHERE voucher_code = ? LIMIT 1',
            [normalizeText(voucherCode)]
        );
        return rows[0] || null;
    }

    static async claimVoucher(userId, voucherCode) {
        const voucher = await this.getVoucherByCode(voucherCode);

        if (!voucher) {
            throw new Error('Voucher tidak ditemukan.');
        }

        if (!voucher.isActive) {
            throw new Error('Voucher sedang tidak aktif.');
        }

        const pointsCost = Number(voucher.points_cost || 0);

        return await withTransaction(async (connection) => {
            const queryWithConn = (sql, params) => connection.query(sql, params);

            const pointRows = await queryWithConn(
                'SELECT total_points, voucher_points FROM user_points WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            let currentPoints = 0;
            let currentVoucherPoints = 0;

            if (pointRows.length) {
                currentPoints = Number(pointRows[0].total_points || 0);
                currentVoucherPoints = Number(pointRows[0].voucher_points || 0);
            } else {
                await queryWithConn(
                    'INSERT INTO user_points (user_id, total_points, commission_points, mission_points, cashback_points, voucher_points) VALUES (?, 0, 0, 0, 0, 0)',
                    [userId]
                );
            }

            if (currentPoints < pointsCost) {
                throw new Error('Poin user tidak mencukupi.');
            }

            const nextVoucherPoints = Math.max(currentVoucherPoints - pointsCost, 0);
            const nextTotalPoints = currentPoints - pointsCost;

            await queryWithConn(
                'UPDATE user_points SET total_points = ?, voucher_points = ? WHERE user_id = ?',
                [nextTotalPoints, nextVoucherPoints, userId]
            );

            const redemptionId = generateId();
            await queryWithConn(
                'INSERT INTO redemption_logs (id, user_id, voucher_code, points_used, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [redemptionId, userId, voucher.voucher_code, pointsCost, 'COMPLETED']
            );

            try {
                const voucherClaimId = generateId();
                await queryWithConn(
                    'INSERT INTO user_voucher (id, user_id, voucher_code, claimed_at, status) VALUES (?, ?, ?, NOW(), ?)',
                    [voucherClaimId, userId, voucher.voucher_code, 'ACTIVE']
                );
            } catch (tableError) {
                console.warn('[VoucherService] user_voucher table may not exist:', tableError.message);
            }

            await queryWithConn(
                'INSERT INTO point_logs (user_id, point_type, points, reference_type, reference_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [userId, 'voucher', -pointsCost, 'voucher', voucher.voucher_code, 'Claim voucher: ' + voucher.voucher_name]
            );

            return {
                userId,
                voucherCode: voucher.voucher_code,
                voucherName: voucher.voucher_name,
                voucherType: voucher.voucher_type,
                pointsUsed: pointsCost,
                remainingPoints: nextTotalPoints,
                status: 'ACTIVE',
            };
        });
    }

    static async getAllVouchersAdmin() {
        const rows = await query(
            'SELECT voucher_code, voucher_name, voucher_type, points_cost, value_amount, is_active, created_at FROM vouchers ORDER BY created_at DESC'
        );
        return rows.map((row) => ({
            voucherCode: row.voucher_code,
            voucherName: row.voucher_name,
            voucherType: row.voucher_type,
            pointsCost: Number(row.points_cost || 0),
            valueAmount: Number(row.value_amount || 0),
            isActive: Boolean(row.is_active),
            createdAt: row.created_at,
        }));
    }

    static async createVoucher(data) {
        const { voucher_code, voucher_name, voucher_type, points_cost, value_amount, is_active } = data;

        if (!voucher_code || !voucher_name || !voucher_type || points_cost === undefined) {
            throw new Error('voucher_code, voucher_name, voucher_type, dan points_cost wajib diisi.');
        }

        const existing = await query('SELECT voucher_code FROM vouchers WHERE voucher_code = ? LIMIT 1', [voucher_code]);
        if (existing.length > 0) {
            throw new Error('Voucher code sudah ada.');
        }

        await query(
            'INSERT INTO vouchers (voucher_code, voucher_name, voucher_type, points_cost, value_amount, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [voucher_code, voucher_name, voucher_type, points_cost, value_amount || 0, is_active !== false ? 1 : 0]
        );

        return { voucherCode: voucher_code };
    }

    static async updateVoucher(voucherCode, data) {
        const { voucher_name, voucher_type, points_cost, value_amount, is_active } = data;

        const existing = await query('SELECT voucher_code FROM vouchers WHERE voucher_code = ? LIMIT 1', [voucherCode]);
        if (existing.length === 0) {
            throw new Error('Voucher tidak ditemukan.');
        }

        await query(
            'UPDATE vouchers SET voucher_name = ?, voucher_type = ?, points_cost = ?, value_amount = ?, is_active = ? WHERE voucher_code = ?',
            [
                voucher_name,
                voucher_type,
                points_cost,
                value_amount || 0,
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
