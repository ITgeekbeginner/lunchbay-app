const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lunchbay',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database:', dbConfig.database);
        await connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 Please check:');
        console.log('   - Is MySQL running?');
        console.log('   - Are the credentials in .env correct?');
        console.log('   - Does the database exist?');
        return false;
    }
}

// Initialize database with required tables
async function initializeDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('creating tables ...');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS inventory_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category_id INT NOT NULL,
                quantity INT NOT NULL CHECK (quantity >= 0),
                unit VARCHAR(50) NOT NULL,
                expiration_date DATE NOT NULL,
                item_condition ENUM('excellent', 'good', 'fair') NOT NULL,
                notes TEXT,
                status VARCHAR(50) NOT NULL DEFAULT 'fresh',  
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                INDEX idx_expiration (expiration_date),
                INDEX idx_status (status),
                INDEX idx_category (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        console.log('Tables created successfully.');

        // Insert default categories if they don't exist
        const defaultCategories = [
            ['fruits', 'Fruits and Vegetables'],
            ['dairy', 'Dairy Products'],
            ['meat', 'Meat and Poultry'],
            ['bakery', 'Bakery Items'],
            ['prepared', 'Prepared Foods'],
            ['beverages', 'Beverages'],
            ['other', 'Other Food Items']
        ];

       console.log('📝 Inserting default categories...');
        for (const [name, description] of defaultCategories) {
            await connection.execute(
                'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
                [name, description]
            );
        }
     // Check if we need sample data
        const [itemCount] = await connection.execute('SELECT COUNT(*) as count FROM inventory_items');
        
        if (itemCount[0].count === 0) {
            console.log('📦 Inserting sample data...');
            const sampleData = [
                ['Organic Apples', 'fruits', 25, 'pieces', getDateString(7), 'excellent', 'Fresh from local farm'],
                ['Whole Milk', 'dairy', 3, 'gallons', getDateString(5), 'good', 'Organic whole milk'],
                ['Chicken Breast', 'meat', 8, 'lbs', getDateString(3), 'excellent', 'Boneless skinless'],
                ['Artisan Bread', 'bakery', 12, 'loaves', getDateString(2), 'good', 'Sourdough'],
                ['Vegetable Soup', 'prepared', 15, 'servings', getDateString(1), 'good', 'Homemade'],
                ['Expired Yogurt', 'dairy', 5, 'containers', getDateString(-2), 'fair', 'Needs disposal'],
                ['Fresh Salad', 'fruits', 10, 'lbs', getDateString(10), 'excellent', 'Mixed greens']
            ];

            for (const [name, category, quantity, unit, expiration, condition, notes] of sampleData) {
                await connection.execute(
                    `INSERT INTO inventory_items (name, category_id, quantity, unit, expiration_date, condition, notes) 
                     VALUES (?, (SELECT id FROM categories WHERE name = ?), ?, ?, ?, ?, ?)`,
                    [name, category, quantity, unit, expiration, condition, notes]
                );
            }
            console.log('✅ Sample data inserted');
        }

        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    } finally{
        if (connection) connection.release();
    }
}

// Helper function to get date strings
function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase
};