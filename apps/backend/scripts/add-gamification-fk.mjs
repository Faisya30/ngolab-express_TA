import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ngolab_express_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function addForeignKeyIfNotExists(table, constraintName, sql) {
    const conn = await pool.getConnection();
    try {
        // Check if constraint exists
        const [constraints] = await conn.query(
            `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
            [process.env.DB_NAME || 'ngolab_express_system', table, constraintName]
        );
        
        if (constraints.length === 0) {
            await conn.query(sql);
            return true;
        }
        return false;
    } finally {
        conn.release();
    }
}

async function runFKMigration() {
    console.log('Adding Foreign Key constraints to gamification tables...\n');
    
    await addForeignKeyIfNotExists(
        'UserGamification',
        'fk_usgamification_user_id',
        'ALTER TABLE UserGamification ADD CONSTRAINT fk_usgamification_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE'
    ).then(added => console.log(`UserGamification FK: ${added ? '✓ Added' : '✗ Already exists'}`));
    
    await addForeignKeyIfNotExists(
        'UserMissions',
        'fk_usermissions_user_id',
        'ALTER TABLE UserMissions ADD CONSTRAINT fk_usermissions_user_id FOREIGN KEY (userId) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE'
    ).then(added => console.log(`UserMissions userId FK: ${added ? '✓ Added' : '✗ Already exists'}`));
    
    await addForeignKeyIfNotExists(
        'UserMissions',
        'fk_usermissions_mission_id',
        'ALTER TABLE UserMissions ADD CONSTRAINT fk_usermissions_mission_id FOREIGN KEY (missionId) REFERENCES Missions(id) ON UPDATE CASCADE ON DELETE CASCADE'
    ).then(added => console.log(`UserMissions missionId FK: ${added ? '✓ Added' : '✗ Already exists'}`));
    
    await addForeignKeyIfNotExists(
        'PointsHistory',
        'fk_pointshistory_user_id',
        'ALTER TABLE PointsHistory ADD CONSTRAINT fk_pointshistory_user_id FOREIGN KEY (userId) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE'
    ).then(added => console.log(`PointsHistory FK: ${added ? '✓ Added' : '✗ Already exists'}`));
    
    await addForeignKeyIfNotExists(
        'GamePlays',
        'fk_gameplays_user_id',
        'ALTER TABLE GamePlays ADD CONSTRAINT fk_gameplays_user_id FOREIGN KEY (userId) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE'
    ).then(added => console.log(`GamePlays userId FK: ${added ? '✓ Added' : '✗ Already exists'}`));
    
    await addForeignKeyIfNotExists(
        'GamePlays',
        'fk_gameplays_game_id',
        'ALTER TABLE GamePlays ADD CONSTRAINT fk_gameplays_game_id FOREIGN KEY (gameId) REFERENCES Games(id) ON UPDATE CASCADE ON DELETE CASCADE'
    ).then(added => console.log(`GamePlays gameId FK: ${added ? '✓ Added' : '✗ Already exists'}`));
    
    console.log('\n✓ Foreign Key migration completed!');
    process.exit(0);
}

runFKMigration().catch(err => {
    console.error('FK Migration failed:', err);
    process.exit(1);
});