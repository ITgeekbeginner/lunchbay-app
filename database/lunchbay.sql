-- Create database
CREATE DATABASE IF NOT EXISTS lunchbay;
USE lunchbay;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    unit VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    item_condition ENUM('excellent', 'good', 'fair') NOT NULL,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'fresh',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('fruits', 'Fruits and Vegetables'),
('dairy', 'Dairy Products'),
('meat', 'Meat and Poultry'),
('bakery', 'Bakery Items'),
('prepared', 'Prepared Foods'),
('beverages', 'Beverages'),
('other', 'Other Food Items');

-- Insert sample data
INSERT INTO inventory_items (name, category_id, quantity, unit, expiration_date, item_condition, notes) VALUES
('Leftover Pizza', (SELECT id FROM categories WHERE name = 'prepared'), 5, 'servings', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'good', 'From yesterday''s event'),
('Fresh Salad', (SELECT id FROM categories WHERE name = 'fruits'), 2, 'lbs', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'excellent', ''),
('Leftover Pasta', (SELECT id FROM categories WHERE name = 'prepared'), 3, 'servings', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'good', ''),
('Milk', (SELECT id FROM categories WHERE name = 'dairy'), 1, 'gallons', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'good', ''),
('Bread Rolls', (SELECT id FROM categories WHERE name = 'bakery'), 12, 'pieces', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'fair', 'Slightly stale but still good');

-- Create triggers to set status based on current date
DELIMITER $$
CREATE TRIGGER set_inventory_status_before_insert
BEFORE INSERT ON inventory_items
FOR EACH ROW
BEGIN
  IF NEW.expiration_date < CURDATE() THEN
    SET NEW.status = 'expired';
  ELSEIF NEW.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN
    SET NEW.status = 'expiring';
  ELSE
    SET NEW.status = 'fresh';
  END IF;
END$$

CREATE TRIGGER set_inventory_status_before_update
BEFORE UPDATE ON inventory_items
FOR EACH ROW
BEGIN
  IF NEW.expiration_date < CURDATE() THEN
    SET NEW.status = 'expired';
  ELSEIF NEW.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN
    SET NEW.status = 'expiring';
  ELSE
    SET NEW.status = 'fresh';
  END IF;
END$$
DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_inventory_expiration ON inventory_items(expiration_date);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_status ON inventory_items(status);