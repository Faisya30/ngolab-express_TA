import { MissionRepository } from '../repositories/MissionRepository.js';
import { UserMissionRepository } from '../repositories/UserMissionRepository.js';
import { UserGamificationRepository } from '../repositories/UserGamificationRepository.js';
import { PointsHistoryRepository } from '../repositories/PointsHistoryRepository.js';
import { withTransaction } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

export class MissionService {
    static async getAllMissions() {
        return await MissionRepository.findAll();
    }

    static async getActiveMissions() {
        return await MissionRepository.findActive();
    }

    static async createMission(data) {
        const { id, title, description, rewardPoints, target, type, icon, status } = data;
        
        const missionId = id || generateId();
        
        return await MissionRepository.create({
            id: missionId,
            title,
            description,
            rewardPoints,
            target,
            type,
            icon,
            status
        });
    }

    static async updateMission(id, data) {
        return await MissionRepository.update(id, data);
    }

    static async deleteMission(id) {
        return await MissionRepository.delete(id);
    }
}