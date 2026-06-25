import { GameService } from '../services/GameService.js';

export async function getGames(req, res) {
    try {
        const games = await GameService.getAllGames();
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: games
        });
    } catch (error) {
        const statusCode = error.message === 'Game tidak ditemukan' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

export async function createGame(req, res) {
    try {
        const { type, name, cost_points, reward_points, is_active, config_data } = req.body || {};
        
        if (!type || !name) {
            return res.status(400).json({
                success: false,
                message: 'type dan name wajib diisi'
            });
        }
        
        const game = await GameService.createGame({
            type,
            name,
            cost_points,
            reward_points,
            is_active,
            config_data
        });
        
        return res.json({
            success: true,
            message: 'Game berhasil dibuat',
            data: game
        });
    } catch (error) {
        const statusCode = error.message === 'Game tidak ditemukan' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateGame(req, res) {
    try {
        const id = String(req.params.id || '').trim();
        const data = req.body || {};
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id game wajib diisi'
            });
        }
        
        const game = await GameService.updateGame(id, data);
        
        return res.json({
            success: true,
            message: 'Game berhasil diupdate',
            data: game
        });
    } catch (error) {
        const statusCode = error.message === 'Game tidak ditemukan' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

export async function deleteGame(req, res) {
    try {
        const id = String(req.params.id || '').trim();
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'id game wajib diisi'
            });
        }
        
        await GameService.deleteGame(id);
        
        return res.json({
            success: true,
            message: 'Game berhasil dihapus'
        });
    } catch (error) {
        const statusCode = error.message === 'Game tidak ditemukan' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

export async function playGame(req, res) {
    console.log('🔥 BACKEND PUSAT PLAYGAME HIT 🔥');
    console.log('REQUEST URL:', req.originalUrl);
    console.log('REQUEST BODY:', req.body);
    try {
        console.log('SCRATCH BODY', req.body);
        console.log('SCRATCH QUERY', req.query);
        console.log('SCRATCH PARAMS', req.params);
        console.log('SCRATCH MEMBERSHIP AUTH', req.membershipAuth);
        
        const userId = req.body?.userId || req.query?.userId || req.membershipAuth?.user_id || req.membershipAuth?.sub;
        const gameId = req.body?.gameId || req.query?.gameId;
        
        if (!userId || !gameId) {
            return res.status(400).json({
                success: false,
                message: 'userId dan gameId wajib diisi'
            });
        }
        
        const result = await GameService.playGame(userId, gameId);
        
        return res.json({
            success: true,
            message: 'Game berhasil dimainkan',
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function getCooldown(req, res) {
    console.log('GET COOLDOWN HIT');
    console.log('QUERY:', req.query);
    console.log('BODY:', req.body);
    try {
        const userId = String(req.query.userId || req.body?.userId || '').trim();
        const gameId = String(req.query.gameId || req.body?.gameId || '').trim();
        
        if (!userId || !gameId) {
            return res.status(400).json({
                success: false,
                message: 'userId dan gameId wajib diisi'
            });
        }
        
        const result = await GameService.getCooldown(userId, gameId);
        
        return res.json({
            success: true,
            ...result
        });
    } catch (error) {
        const statusCode = error.message === 'Game tidak ditemukan' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}