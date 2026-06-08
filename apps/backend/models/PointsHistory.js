export class PointsHistory {
    constructor({ id, userId, points, description, createdAt = new Date() }) {
        this.id = id;
        this.userId = userId;
        this.points = points;
        this.description = description;
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            points: this.points,
            description: this.description,
            createdAt: this.createdAt
        };
    }
}