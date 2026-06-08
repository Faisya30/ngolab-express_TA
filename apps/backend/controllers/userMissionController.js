import { UserMissionService } from '../services/UserMissionService.js';

export async function getUserMissions(req, res) {
    try {
        const userId = req.query.userId || req.body?.userId;
        
        let userMissions;
        if (userId) {
            userMissions = await UserMissionService.getUserMissions(userId);
        } else {
            userMissions = await UserMissionService.getAllUserMissions();
        }
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: userMissions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function completeMission(req, res) {
    try {
        const { userId, missionId } = req.body || {};
        
        if (!userId || !missionId) {
            return res.status(400).json({
                success: false,
                message: 'userId dan missionId wajib diisi'
            });
        }
        
        const result = await UserMissionService.completeMission(userId, missionId);
        
        return res.json({
            success: true,
            message: 'Mission berhasil diselesaikan',
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}