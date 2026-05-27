ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50) NULL AFTER membership_level;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_upline VARCHAR(80) NULL AFTER referred_by;

ALTER TABLE affiliate_networks
  ADD COLUMN IF NOT EXISTS affiliate_id VARCHAR(80) NULL AFTER user_id;

ALTER TABLE affiliate_networks
  ADD COLUMN IF NOT EXISTS total_downlines INT NOT NULL DEFAULT 0 AFTER total_referrals;

ALTER TABLE affiliate_networks
  ADD COLUMN IF NOT EXISTS level VARCHAR(50) NOT NULL DEFAULT 'Starter' AFTER total_downlines;

ALTER TABLE affiliate_networks
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(6,4) NOT NULL DEFAULT 0.02 AFTER level;

ALTER TABLE affiliate_networks
  ADD COLUMN IF NOT EXISTS commission_points DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER commission_rate;

UPDATE affiliate_networks
SET affiliate_id = CONCAT('AFF-', user_id)
WHERE affiliate_id IS NULL OR affiliate_id = '';

ALTER TABLE affiliate_networks
  MODIFY COLUMN affiliate_id VARCHAR(80) NOT NULL;

CREATE UNIQUE INDEX ux_affiliate_networks_affiliate_id ON affiliate_networks (affiliate_id);

ALTER TABLE users
  ADD CONSTRAINT fk_users_affiliate_upline
  FOREIGN KEY (affiliate_upline) REFERENCES affiliate_networks(affiliate_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS affiliate_commission_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  affiliate_id VARCHAR(80) NOT NULL,
  member_id VARCHAR(50) NOT NULL,
  transaction_code VARCHAR(50) NULL,
  transaction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_earned DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_affiliate_commission_affiliate_id (affiliate_id),
  INDEX idx_affiliate_commission_member_id (member_id),
  INDEX idx_affiliate_commission_transaction_code (transaction_code),
  CONSTRAINT fk_affiliate_commission_logs_affiliate_id
    FOREIGN KEY (affiliate_id) REFERENCES affiliate_networks(affiliate_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_affiliate_commission_logs_member_id
    FOREIGN KEY (member_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
