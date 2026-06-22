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
        const { id, title, description, missionType, rewardPoints, target, productCode, icon, status } = data;
        const validTypes = ['CHECKIN', 'TRANSACTION', 'PRODUCT_PURCHASE'];

        if (missionType && !validTypes.includes(missionType)) {
            throw new Error('missionType tidak valid. Harus CHECKIN, TRANSACTION, atau PRODUCT_PURCHASE.');
        }

        if (missionType === 'PRODUCT_PURCHASE' && !productCode) {
            throw new Error('productCode wajib diisi untuk tipe PRODUCT_PURCHASE.');
        }

        const missionId = id || generateId();

        return await MissionRepository.create({
            id: missionId,
            title,
            description,
            type: missionType,
            rewardPoints,
            target,
            productCode,
            icon,
            status
        });
    }

    static async updateMission(id, data) {
        const { missionType, productCode, ...rest } = data;
        const validTypes = ['CHECKIN', 'TRANSACTION', 'PRODUCT_PURCHASE'];

        if (missionType && !validTypes.includes(missionType)) {
            throw new Error('missionType tidak valid. Harus CHECKIN, TRANSACTION, atau PRODUCT_PURCHASE.');
        }

        if (missionType === 'PRODUCT_PURCHASE' && !productCode) {
            throw new Error('productCode wajib diisi untuk tipe PRODUCT_PURCHASE.');
        }

        const updateData = {
            ...rest,
            type: missionType,
            productCode
        };

        return await MissionRepository.update(id, updateData);
    }

    static async deleteMission(id) {
        return await MissionRepository.delete(id);
    }
}