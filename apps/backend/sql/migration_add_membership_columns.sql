ALTER TABLE orders
ADD COLUMN user_id VARCHAR(50) NULL
AFTER nama_pelanggan;

ALTER TABLE orders
ADD COLUMN tipe_pelanggan VARCHAR(20) NULL
AFTER id;

ALTER TABLE orders
ADD COLUMN nama_pelanggan VARCHAR(100) NULL
AFTER service_type;
