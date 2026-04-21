CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Super Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category_code VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url TEXT NULL,
  description TEXT NULL,
  is_recommended TINYINT(1) NOT NULL DEFAULT 0,
  cashback_reward INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category_code
    FOREIGN KEY (category_code) REFERENCES categories(code)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  type ENUM('PERCENT','VALUE') NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  cashback_points INT NOT NULL DEFAULT 0,
  is_affiliate TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(50) NOT NULL UNIQUE,
  service_type VARCHAR(30) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL,
  member_code VARCHAR(50) NULL,
  voucher_code VARCHAR(50) NULL,
  points_earned INT NOT NULL DEFAULT 0,
  points_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_member_code
    FOREIGN KEY (member_code) REFERENCES members(code)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_orders_voucher_code
    FOREIGN KEY (voucher_code) REFERENCES vouchers(code)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(50) NOT NULL,
  product_code VARCHAR(50) NULL,
  product_name_snapshot VARCHAR(150) NOT NULL,
  price_snapshot DECIMAL(12,2) NOT NULL DEFAULT 0,
  qty INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_items_order_code
    FOREIGN KEY (order_code) REFERENCES orders(order_code)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product_code
    FOREIGN KEY (product_code) REFERENCES products(code)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS member_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_code VARCHAR(50) NOT NULL,
  order_code VARCHAR(50) NULL,
  points_earned INT NOT NULL DEFAULT 0,
  points_used INT NOT NULL DEFAULT 0,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_logs_member_code
    FOREIGN KEY (member_code) REFERENCES members(code)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_member_logs_order_code
    FOREIGN KEY (order_code) REFERENCES orders(order_code)
    ON UPDATE CASCADE ON DELETE SET NULL
);

INSERT IGNORE INTO categories (code, name, is_active) VALUES
('recommended', 'Andalan', 1),
('all', 'Semua Menu', 1),
('bakso', 'Bakso', 1),
('mie', 'Mie Yamin', 1),
('drinks', 'Minuman', 1);

INSERT IGNORE INTO members (code, name, cashback_points, is_affiliate) VALUES
('MEM-001', 'Guest Member', 1500, 0);
