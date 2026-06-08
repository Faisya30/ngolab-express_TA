export class GamePlay {
    constructor({ id, userId, gameId, gameType, costPoints = 0, rewardPoints = 0, prizeLabel = null, timestamp = new Date() }) {
        this.id = id;
        this.userId = userId;
        this.gameId = gameId;
        this.gameType = gameType;
        this.costPoints = costPoints;
        this.rewardPoints = rewardPoints;
        this.prizeLabel = prizeLabel;
        this.timestamp = timestamp;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            gameId: this.gameId,
            gameType: this.gameType,
            costPoints: this.costPoints,
            rewardPoints: this.rewardPoints,
            prizeLabel: this.prizeLabel,
            timestamp: this.timestamp
        };
    }
}