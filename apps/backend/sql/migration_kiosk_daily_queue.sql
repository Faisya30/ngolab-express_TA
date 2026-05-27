-- Migration: add daily kiosk queue numbering without affecting CV/member flows.
-- Run once on databases that already exist.

CREATE TABLE IF NOT EXISTS kiosk_queue_counters (
  counter_date DATE NOT NULL PRIMARY KEY,
  last_queue_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

SET @has_queue_number := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'queue_number'
);

SET @sql_add_queue_number := IF(
  @has_queue_number = 0,
  'ALTER TABLE orders ADD COLUMN queue_number INT NULL AFTER order_code',
  'SELECT ''Column queue_number already exists'' AS info'
);

PREPARE stmt_add_queue_number FROM @sql_add_queue_number;
EXECUTE stmt_add_queue_number;
DEALLOCATE PREPARE stmt_add_queue_number;
