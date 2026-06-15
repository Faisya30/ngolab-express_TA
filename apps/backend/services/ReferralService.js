import { query } from '../config/db.js';

function normalizeText(value) {
    return String(value || '').trim();
}

export class ReferralService {
    static async getReferralMembers(authUserId, affiliateId) {
        if (authUserId !== affiliateId) {
            throw new Error('Akses ditolak: Anda hanya dapat melihat referral milik sendiri.');
        }

        const referredRows = await query(
            'SELECT user_id, username, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC',
            [normalizeText(affiliateId)]
        );

        if (!referredRows.length) {
            return [];
        }

        const userIds = referredRows.map((r) => r.user_id);
        const inClause = userIds.map(() => '?').join(',');
        const pointRows = await query(
            `SELECT user_id, COALESCE(total_points, 0) AS total_points
             FROM user_points
             WHERE user_id IN (${inClause})`,
            userIds
        );

        const pointsMap = new Map(pointRows.map((r) => [r.user_id, Number(r.total_points || 0)]));

        return referredRows.map((row) => ({
            name: row.username,
            joinedDate: row.created_at,
            contributionPoints: pointsMap.get(row.user_id) || 0,
        }));
    }

    static async getAffiliateByReferralCode(referralCode) {
        const rows = await query(
            'SELECT user_id, affiliate_id FROM affiliate_networks WHERE referral_code = ? LIMIT 1',
            [normalizeText(referralCode)]
        );
        return rows[0] || null;
    }

    static async getAffiliateStats(affiliateId) {
        const rows = await query(
            `SELECT COUNT(*) AS totalMembers,
                    COALESCE(SUM(up.total_points), 0) AS totalPoints
             FROM affiliate_networks an
             JOIN user_points up ON up.user_id = an.user_id
             WHERE an.affiliate_id = ?`,
            [normalizeText(affiliateId)]
        );
        return {
            totalMembers: Number(rows[0]?.totalMembers || 0),
            totalPoints: Number(rows[0]?.totalPoints || 0),
        };
    }
}
