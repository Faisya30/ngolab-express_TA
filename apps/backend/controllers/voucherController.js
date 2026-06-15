import { query } from '../config/db.js';
import { VoucherService } from '../services/VoucherService.js';

export async function getVouchers(req, res) {
    try {
        const vouchers = await VoucherService.getAllVouchers();
        return res.json({
            success: true,
            message: 'Berhasil',
            data: vouchers
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function claimVoucher(req, res) {
    try {
        const { userId, voucherId } = req.body || {};

        if (!userId || !voucherId) {
            return res.status(400).json({
                success: false,
                message: 'userId dan voucherId wajib diisi'
            });
        }

        const result = await VoucherService.claimVoucher(userId, voucherId);

        return res.json({
            success: true,
            message: 'Voucher berhasil diklaim',
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function getUserVouchers(req, res) {
    try {
        const userId = String(req.membershipAuth?.user_id || req.membershipAuth?.sub || '').trim();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid.'
            });
        }

        const rows = await query(
            'SELECT uv.id, uv.user_id, uv.voucher_code, v.voucher_name, v.voucher_type, v.value_amount, uv.claimed_at, uv.status FROM user_voucher uv JOIN vouchers v ON v.voucher_code = uv.voucher_code WHERE uv.user_id = ? ORDER BY uv.claimed_at DESC',
            [userId]
        );

        const vouchers = rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            voucherCode: row.voucher_code,
            voucherName: row.voucher_name,
            voucherType: row.voucher_type,
            valueAmount: Number(row.value_amount || 0),
            claimedAt: row.claimed_at,
            status: row.status,
        }));

        return res.json({
            success: true,
            message: 'Berhasil',
            data: vouchers
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function createVoucher(req, res) {
    try {
        const { voucher_code, voucher_name, voucher_type, points_cost, value_amount, is_active } = req.body || {};

        if (!voucher_code || !voucher_name || !voucher_type || points_cost === undefined) {
            return res.status(400).json({
                success: false,
                message: 'voucher_code, voucher_name, voucher_type, dan points_cost wajib diisi.'
            });
        }

        await VoucherService.createVoucher({
            voucher_code,
            voucher_name,
            voucher_type,
            points_cost,
            value_amount,
            is_active
        });

        return res.json({
            success: true,
            message: 'Voucher berhasil dibuat'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateVoucher(req, res) {
    try {
        const { id } = req.params;
        const { voucher_name, voucher_type, points_cost, value_amount, is_active } = req.body || {};

        await VoucherService.updateVoucher(id, {
            voucher_name,
            voucher_type,
            points_cost,
            value_amount,
            is_active
        });

        return res.json({
            success: true,
            message: 'Voucher berhasil diupdate'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function deleteVoucher(req, res) {
    try {
        const { id } = req.params;

        await VoucherService.deleteVoucher(id);

        return res.json({
            success: true,
            message: 'Voucher berhasil dihapus'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function getAllVouchers(req, res) {
    try {
        const vouchers = await VoucherService.getAllVouchersAdmin();
        return res.json({
            success: true,
            message: 'Berhasil',
            data: vouchers
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}