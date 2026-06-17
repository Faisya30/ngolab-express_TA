import { PointsHistoryRepository } from '../repositories/PointsHistoryRepository.js';

export async function getPointsHistory(req, res) {
    try {
        const userId = req.query.userId;
        const jwtUserId = req.membershipAuth?.user_id || req.membershipAuth?.sub;
        
        let history;
        if (jwtUserId) {
            history = await PointsHistoryRepository.findByUserId(jwtUserId);
        } else if (userId) {
            history = await PointsHistoryRepository.findByUserId(userId);
        } else {
            history = await PointsHistoryRepository.findAll();
        }
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: history || []
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}