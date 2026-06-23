import { MissionService } from '../services/MissionService.js';

export async function getMissions(req, res) {
    try {
        const missions = await MissionService.getAllMissions();
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: missions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function createMission(req, res) {
    try {
        const { title, description, missionType, rewardPoints, target, productCode, icon, status } = req.body || {};

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'title wajib diisi'
            });
        }

        const mission = await MissionService.createMission({
            title,
            description,
            missionType,
            rewardPoints,
            target,
            productCode,
            icon,
            status
        });

        return res.json({
            success: true,
            message: 'Mission berhasil dibuat',
            data: mission
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateMission(req, res) {
    try {
        const id = String(req.params.id || '').trim();
        const data = req.body || {};
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id mission wajib diisi'
            });
        }
        
        const mission = await MissionService.updateMission(id, data);
        
        return res.json({
            success: true,
            message: 'Mission berhasil diupdate',
            data: mission
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function deleteMission(req, res) {
    try {
        const id = String(req.params.id || '').trim();
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id mission wajib diisi'
            });
        }
        
        await MissionService.deleteMission(id);
        
        return res.json({
            success: true,
            message: 'Mission berhasil dihapus'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}