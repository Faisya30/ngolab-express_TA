export class Mission {
    constructor({ id, title, description, rewardPoints = 0, target = 1, type = 'daily', icon = null, status = 'active' }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.rewardPoints = rewardPoints;
        this.target = target;
        this.type = type;
        this.icon = icon;
        this.status = status;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            rewardPoints: this.rewardPoints,
            target: this.target,
            type: this.type,
            icon: this.icon,
            status: this.status
        };
    }
}