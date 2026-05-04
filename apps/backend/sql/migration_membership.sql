CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('MEMBER', 'MEMBER_AFFILIATE') NOT NULL DEFAULT 'MEMBER',
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
  membership_level ENUM('Silver', 'Gold', 'Platinum') NOT NULL DEFAULT 'Silver',
  referred_by VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  phone_number VARCHAR(30) NULL,
  profile_picture VARCHAR(255) NULL,
  ktm_picture VARCHAR(255) NULL,
  is_ktm TINYINT(1) NOT NULL DEFAULT 0,
  ai_reasoning TEXT NULL,
  CONSTRAINT fk_users_referred_by
    FOREIGN KEY (referred_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS affiliate_networks (
  user_id VARCHAR(50) PRIMARY KEY,
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  affiliate_tier VARCHAR(50) NOT NULL DEFAULT 'Basic',
  total_referrals INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_affiliate_networks_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_points (
  user_id VARCHAR(50) PRIMARY KEY,
  total_points INT NOT NULL DEFAULT 0,
  commission_points INT NOT NULL DEFAULT 0,
  mission_points INT NOT NULL DEFAULT 0,
  cashback_points INT NOT NULL DEFAULT 0,
  voucher_points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_points_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commission_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  receiver_id VARCHAR(50) NOT NULL,
  referred_user_id VARCHAR(50) NOT NULL,
  earned_points INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_commission_logs_receiver_id
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_commission_logs_referred_user_id
    FOREIGN KEY (referred_user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS point_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  point_type ENUM('commission', 'mission', 'cashback', 'voucher') NOT NULL,
  points INT NOT NULL DEFAULT 0,
  reference_type VARCHAR(50) NULL,
  reference_id VARCHAR(50) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_point_logs_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS redemption_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  voucher_code VARCHAR(50) NOT NULL,
  points_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  CONSTRAINT fk_redemption_logs_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS global_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
  voucher_code VARCHAR(50) PRIMARY KEY,
  voucher_name VARCHAR(150) NOT NULL,
  voucher_type ENUM('cashback', 'discount', 'redeem') NOT NULL DEFAULT 'redeem',
  points_cost INT NOT NULL DEFAULT 0,
  value_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  points_reward INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50) NOT NULL UNIQUE,
  user_id VARCHAR(50) NULL,
  transaction_type ENUM('kiosk', 'cv', 'manual') NOT NULL DEFAULT 'kiosk',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  points_used INT NOT NULL DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50) NOT NULL,
  menu_item_code VARCHAR(50) NULL,
  item_name_snapshot VARCHAR(150) NOT NULL,
  price_snapshot DECIMAL(12,2) NOT NULL DEFAULT 0,
  qty INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction_items_transaction_code
    FOREIGN KEY (transaction_code) REFERENCES transactions(transaction_code)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_transaction_items_menu_item_code
    FOREIGN KEY (menu_item_code) REFERENCES menu_items(code)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_ai_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  favorite_category VARCHAR(100) NULL,
  peak_visit_time VARCHAR(100) NULL,
  ai_recommendation TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_ai_insights_user_id
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);