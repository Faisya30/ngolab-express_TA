-- Migration SQL untuk tabel gamifikasi
-- Jalankan file ini di database MySQL Anda

-- Tabel UserGamification
CREATE TABLE IF NOT EXISTS UserGamification (
    user_id VARCHAR(255) PRIMARY KEY,
    points INT DEFAULT 0,
    memberLevel VARCHAR(100) DEFAULT 'Bronze',
    streakCount INT DEFAULT 0,
    lastCheckIn DATETIME NULL
);

-- Tabel Games
CREATE TABLE IF NOT EXISTS Games (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cost_points INT DEFAULT 0,
    reward_points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    config_data JSON
);

-- Tabel Missions
CREATE TABLE IF NOT EXISTS Missions (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rewardPoints INT DEFAULT 0,
    target INT DEFAULT 1,
    type VARCHAR(100) DEFAULT 'daily',
    icon VARCHAR(255),
    status VARCHAR(100) DEFAULT 'active'
);

-- Tabel UserMissions
CREATE TABLE IF NOT EXISTS UserMissions (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    missionId VARCHAR(255) NOT NULL,
    status VARCHAR(100) DEFAULT 'in_progress',
    completedAt DATETIME NULL
);

-- Tabel PointsHistory
CREATE TABLE IF NOT EXISTS PointsHistory (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    points INT NOT NULL,
    description TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel GamePlays
CREATE TABLE IF NOT EXISTS GamePlays (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    gameId VARCHAR(255) NOT NULL,
    gameType VARCHAR(100) NOT NULL,
    costPoints INT DEFAULT 0,
    rewardPoints INT DEFAULT 0,
    prizeLabel VARCHAR(255),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_usermissions_userId ON UserMissions(userId);
CREATE INDEX IF NOT EXISTS idx_usermissions_missionId ON UserMissions(missionId);
CREATE INDEX IF NOT EXISTS idx_pointshistory_userId ON PointsHistory(userId);
CREATE INDEX IF NOT EXISTS idx_gameplays_userId ON GamePlays(userId);
CREATE INDEX IF NOT EXISTS idx_games_type ON Games(type);
CREATE INDEX IF NOT EXISTS idx_missions_status ON Missions(status);