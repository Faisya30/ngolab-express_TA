import { GamePlayRepository } from '../repositories/GamePlayRepository.js';

export async function getGamePlays(req, res) {
    try {
        const userId = req.query.userId;
        
        let plays;
        if (userId) {
            plays = await GamePlayRepository.findByUserId(userId);
        } else {
            plays = await GamePlayRepository.findAll();
        }
        
        return res.json({
            success: true,
            message: 'Berhasil',
            data: plays
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}