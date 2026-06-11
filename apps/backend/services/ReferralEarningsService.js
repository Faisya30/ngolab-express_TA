import { ReferralEarningsRepository } from '../repositories/ReferralEarningsRepository.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

export class ReferralEarningsService {
    static async getAllReferralEarnings() {
        return await ReferralEarningsRepository.findAll();
    }

    static async getReferralEarningsByAffiliateId(affiliateId) {
        return await ReferralEarningsRepository.findByAffiliateId(affiliateId);
    }

    static async createReferralEarning(data) {
        const { id, affiliateId, nominal } = data;
        const earningId = id || generateId();
        return await ReferralEarningsRepository.create({
            id: earningId,
            affiliateId,
            nominal
        });
    }

    static async createMultipleEarnings(affiliateId, nominal, count = 1) {
        const items = Array.from({ length: count }, () => ({
            id: generateId(),
            affiliateId,
            nominal
        }));
        return await ReferralEarningsRepository.createBulk(items);
    }
}