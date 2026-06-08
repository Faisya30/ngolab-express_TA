export class UserGamification {
    constructor({ user_id, points = 0, memberLevel = 'Bronze', streakCount = 0, lastCheckIn = null }) {
        this.user_id = user_id;
        this.points = points;
        this.memberLevel = memberLevel;
        this.streakCount = streakCount;
        this.lastCheckIn = lastCheckIn;
    }

    toJSON() {
        return {
            user_id: this.user_id,
            points: this.points,
            memberLevel: this.memberLevel,
            streakCount: this.streakCount,
            lastCheckIn: this.lastCheckIn
        };
    }
}