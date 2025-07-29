-- Add soft delete columns to tables that need historical data preservation

-- Products soft delete
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_products_deleted_at ON products(deleted_at);

-- Users soft delete (for customer data preservation)
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Orders soft delete (preserve order history)
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);

-- Categories soft delete
ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);

-- Brands soft delete
ALTER TABLE brands ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_brands_deleted_at ON brands(deleted_at);

-- Subcategories soft delete
ALTER TABLE subcategories ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_subcategories_deleted_at ON subcategories(deleted_at);
