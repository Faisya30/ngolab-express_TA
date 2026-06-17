import { ReferralService } from '../services/ReferralService.js';

export async function getReferralMembers(req, res) {
    try {
        const authUserId = String(req.membershipAuth?.user_id || req.membershipAuth?.sub || '').trim();
        const affiliateId = String(req.query.affiliateId || req.query.affiliate_id || '').trim();

        if (!authUserId) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid.'
            });
        }

        const resolvedAffiliateId = affiliateId || authUserId;

        const members = await ReferralService.getReferralMembers(authUserId, resolvedAffiliateId);

        return res.json({
            success: true,
            message: 'Berhasil',
            data: members || []
        });
    } catch (error) {
        if (String(error.message).includes('akses ditolak')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function getReferralStats(req, res) {
    try {
        const affiliateId = String(req.query.affiliateId || '').trim();

        if (!affiliateId) {
            return res.status(400).json({
                success: false,
                message: 'affiliateId wajib diisi'
            });
        }

        const stats = await ReferralService.getAffiliateStats(affiliateId);

        return res.json({
            success: true,
            message: 'Berhasil',
            data: stats
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
