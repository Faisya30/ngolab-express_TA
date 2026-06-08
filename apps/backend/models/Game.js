export class Game {
    constructor({ id, type, name, cost_points = 0, reward_points = 0, is_active = true, config_data = null }) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.cost_points = cost_points;
        this.reward_points = reward_points;
        this.is_active = is_active;
        this.config_data = config_data;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            cost_points: this.cost_points,
            reward_points: this.reward_points,
            is_active: this.is_active,
            config_data: this.config_data
        };
    }
}