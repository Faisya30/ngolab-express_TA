-- Migration support for CV integration while preserving backend pusat naming.
-- Run this file once on database ngolab_express_system.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL AFTER code;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(30) NOT NULL DEFAULT 'kiosk' AFTER points_used,
  ADD COLUMN IF NOT EXISTS tipe_pelanggan VARCHAR(20) NULL AFTER service_type,
  ADD COLUMN IF NOT EXISTS nama_pelanggan VARCHAR(150) NULL AFTER tipe_pelanggan;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS order_item_type VARCHAR(30) NOT NULL DEFAULT 'kiosk' AFTER qty;

-- Create unique barcode index manually if needed and if current data is clean:
-- CREATE UNIQUE INDEX ux_products_barcode ON products (barcode);