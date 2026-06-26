import { query } from '../config/db.js';
import { randomUUID } from 'crypto';

function generateId() {
    return randomUUID().replace(/-/g, '');
}

async function seed() {
    console.log('Seeding gamification data...');
    
    // Get existing users for seeding gamification
    const existingUsers = await query('SELECT user_id FROM users LIMIT 3');
    const userIds = existingUsers.length > 0 
        ? existingUsers.map(u => u.user_id) 
        : ['user-001', 'user-002', 'user-003'];
    
    for (const userId of userIds) {
        const points = Math.floor(Math.random() * 100) + 50;
        await query(
            `INSERT IGNORE INTO UserGamification (user_id, points, memberLevel, streakCount, lastCheckIn) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, points, 'Bronze', 0, null]
        );
        await query(
            `INSERT IGNORE INTO user_points (user_id, total_points, mission_points, voucher_points, cashback_points, commission_points)
             VALUES (?, ?, ?, 0, 0, 0)`,
            [userId, points, points]
        );
    }
    console.log(`Seeded ${userIds.length} users`);
    
    // Create sample missions
    const missions = [
        { id: generateId(), title: 'Daily Login', description: 'Login hari ini', rewardPoints: 10, target: 1, type: 'daily', icon: 'fas fa-calendar-check', status: 'active' },
        { id: generateId(), title: 'Share to Social', description: 'Bagikan ke media sosial', rewardPoints: 20, target: 1, type: 'social', icon: 'fas fa-share-alt', status: 'active' },
        { id: generateId(), title: 'Invite Friend', description: 'Undang teman', rewardPoints: 50, target: 1, type: 'referral', icon: 'fas fa-user-plus', status: 'active' }
    ];
    
    for (const mission of missions) {
        await query(
            `INSERT IGNORE INTO Missions (id, title, description, rewardPoints, target, type, icon, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [mission.id, mission.title, mission.description, mission.rewardPoints, mission.target, mission.type, mission.icon, mission.status]
        );
    }
    console.log(`Seeded ${missions.length} missions`);
    
    // Create sample games
    const games = [
        { id: generateId(), type: 'wheel', name: 'Wheel of Fortune', cost_points: 50, reward_points: 100, is_active: true, config_data: JSON.stringify({ segments: ['10', '20', '50', '100'] }) },
        { id: generateId(), type: 'scratch', name: 'Scratch Card', cost_points: 30, reward_points: 50, is_active: true, config_data: JSON.stringify({ options: ['5', '10', '25', '50', '100'] }) }
    ];
    
    for (const game of games) {
        await query(
            `INSERT IGNORE INTO Games (id, type, name, cost_points, reward_points, is_active, config_data) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [game.id, game.type, game.name, game.cost_points, game.reward_points, game.is_active, game.config_data]
        );
    }
    console.log(`Seeded ${games.length} games`);
    
    console.log('Seeding completed!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});