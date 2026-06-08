export class UserMission {
    constructor({ id, userId, missionId, status = 'in_progress', completedAt = null }) {
        this.id = id;
        this.userId = userId;
        this.missionId = missionId;
        this.status = status;
        this.completedAt = completedAt;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            missionId: this.missionId,
            status: this.status,
            completedAt: this.completedAt
        };
    }
}