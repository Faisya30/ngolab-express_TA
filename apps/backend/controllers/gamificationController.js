import { UserGamificationService } from '../services/UserGamificationService.js';

export async function getUsers(req, res) {
    try {
        const users = await UserGamificationService.getAllUsers();
        return res.json({
            success: true,
            message: 'Berhasil',
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getUserById(req, res) {
    try {
        const user_id = String(req.params.id || '').trim();
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id wajib diisi'
            });
        }
        
        const user = await UserGamificationService.getUserById(user_id);
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateUser(req, res) {
    try {
        const user_id = String(req.params.id || '').trim();
        const data = req.body || {};
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id wajib diisi'
            });
        }
        
        const user = await UserGamificationService.updateUser(user_id, data);
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function addPoints(req, res) {
    try {
        const user_id = String(req.params.id || '').trim();
        const { points, description } = req.body || {};
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id wajib diisi'
            });
        }
        
        if (points === undefined || points === null) {
            return res.status(400).json({
                success: false,
                message: 'points wajib diisi'
            });
        }
        
        const user = await UserGamificationService.addPoints(user_id, points, description || `Menambah ${points} poin`);
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function checkin(req, res) {
    try {
        const user_id = String(req.params?.id || req.membershipAuth?.user_id || req.membershipAuth?.sub || '').trim();
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id wajib diisi'
            });
        }
        
        const user = await UserGamificationService.checkin(user_id);
        
        return res.json({
            success: true,
            message: 'Check-in berhasil',
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}