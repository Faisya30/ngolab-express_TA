import { ReferralEarningsService } from '../services/ReferralEarningsService.js';

export async function getReferralEarnings(req, res) {
    try {
        const affiliateId = req.query.affiliateId;
        let earnings;
        if (affiliateId) {
            earnings = await ReferralEarningsService.getReferralEarningsByAffiliateId(affiliateId);
        } else {
            earnings = await ReferralEarningsService.getAllReferralEarnings();
        }
        return res.json({
            success: true,
            message: 'Berhasil',
            data: earnings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function createReferralEarning(req, res) {
    try {
        const { affiliateId, nominal } = req.body || {};
        if (!affiliateId) {
            return res.status(400).json({
                success: false,
                message: 'affiliateId wajib diisi'
            });
        }
        const earning = await ReferralEarningsService.createReferralEarning({
            affiliateId,
            nominal
        });
        return res.json({
            success: true,
            message: 'Referral earning berhasil dibuat',
            data: earning
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}