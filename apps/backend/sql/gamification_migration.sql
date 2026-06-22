-- Migration SQL untuk tabel gamifikasi
-- Jalankan file ini di database MySQL Anda

-- Tabel Games (tidak ada FK)
CREATE TABLE IF NOT EXISTS Games (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cost_points INT DEFAULT 0,
    reward_points INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    config_data JSON
);

-- Tabel Missions (tidak ada FK)
CREATE TABLE IF NOT EXISTS Missions (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rewardPoints INT DEFAULT 0,
    target INT DEFAULT 1,
    type VARCHAR(100) DEFAULT 'CHECKIN',
    product_code VARCHAR(255) NULL,
    icon VARCHAR(255),
    status VARCHAR(100) DEFAULT 'active'
);

-- Tabel UserGamification
CREATE TABLE IF NOT EXISTS UserGamification (
    user_id VARCHAR(255) PRIMARY KEY,
    points INT DEFAULT 0,
    memberLevel VARCHAR(100) DEFAULT 'Bronze',
    streakCount INT DEFAULT 0,
    lastCheckIn DATETIME NULL,
    CONSTRAINT fk_usgamification_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabel UserMissions
CREATE TABLE IF NOT EXISTS UserMissions (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    missionId VARCHAR(255) NOT NULL,
    status VARCHAR(100) DEFAULT 'in_progress',
    completedAt DATETIME NULL,
    CONSTRAINT fk_usermissions_user_id 
    FOREIGN KEY (userId) REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_usermissions_mission_id 
    FOREIGN KEY (missionId) REFERENCES Missions(id) 
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabel PointsHistory
CREATE TABLE IF NOT EXISTS PointsHistory (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    points INT NOT NULL,
    description TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pointshistory_user_id 
    FOREIGN KEY (userId) REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE
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
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gameplays_user_id 
    FOREIGN KEY (userId) REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_gameplays_game_id 
    FOREIGN KEY (gameId) REFERENCES Games(id) 
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabel ReferralEarnings
CREATE TABLE IF NOT EXISTS ReferralEarnings (
    id VARCHAR(255) PRIMARY KEY,
    affiliateId VARCHAR(255) NOT NULL,
    nominal DECIMAL(12,2) NOT NULL DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_referral_earnings_affiliate_id 
    FOREIGN KEY (affiliateId) REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Index untuk optimasi query (abaikan error jika sudah ada)
CREATE INDEX idx_usermissions_userId ON UserMissions(userId);
CREATE INDEX idx_usermissions_missionId ON UserMissions(missionId);
CREATE INDEX idx_pointshistory_userId ON PointsHistory(userId);
CREATE INDEX idx_gameplays_userId ON GamePlays(userId);
CREATE INDEX idx_games_type ON Games(type);
CREATE INDEX idx_missions_status ON Missions(status);
CREATE INDEX idx_referral_earnings_affiliateId ON ReferralEarnings(affiliateId);