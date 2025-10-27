const express = require('express');
const db = require('../database');

const router = express.Router();

// Get all inventory items with category names
router.get('/inventory', async (req, res) => {
    try {
        const { category, status, search } = req.query;
        
        let query = `
            SELECT 
                i.*,
                c.name as category_name,
                c.description as category_description
            FROM inventory_items i
            JOIN categories c ON i.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND c.name = ?';
            params.push(category);
        }

        if (status) {
            query += ' AND i.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND i.name LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY i.expiration_date ASC, i.created_at DESC';

        const [rows] = await db.execute(query, params);
        
        res.json({
            success: true,
            data: rows,
            total: rows.length
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory items'
        });
    }
});

// Get inventory statistics
router.get('/inventory/stats', async (req, res) => {
    try {
        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM inventory_items 
            GROUP BY status
            UNION ALL
            SELECT 
                'total' as status,
                COUNT(*) as count
            FROM inventory_items
        `;

        const [rows] = await db.execute(query);
        
        const stats = {
            expired: 0,
            expiring: 0,
            fresh: 0,
            total: 0
        };

        rows.forEach(row => {
            if (row.status in stats) {
                stats[row.status] = row.count;
            }
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory statistics'
        });
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY name');
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories'
        });
    }
});

// Get single inventory item
router.get('/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                i.*,
                c.name as category_name
            FROM inventory_items i
            JOIN categories c ON i.category_id = c.id
            WHERE i.id = ?
        `;
        
        const [rows] = await db.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory item'
        });
    }
});

// Create new inventory item
router.post('/inventory', async (req, res) => {
    try {
        const { name, category, quantity, unit, expiration_date, condition, notes } = req.body;
        
        // Validate required fields
        if (!name || !category || !quantity || !unit || !expiration_date || !condition) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get category ID
        const [categoryRows] = await db.execute('SELECT id FROM categories WHERE name = ?', [category]);
        if (categoryRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        const categoryId = categoryRows[0].id;

        const query = `
            INSERT INTO inventory_items (name, category_id, quantity, unit, expiration_date, condition, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [
            name, categoryId, quantity, unit, expiration_date, condition, notes || null
        ]);

        // Get the created item
        const [newItem] = await db.execute(`
            SELECT i.*, c.name as category_name 
            FROM inventory_items i 
            JOIN categories c ON i.category_id = c.id 
            WHERE i.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            data: newItem[0],
            message: 'Inventory item created successfully'
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating inventory item'
        });
    }
});

// Update inventory item
router.put('/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, quantity, unit, expiration_date, condition, notes } = req.body;
        
        // Check if item exists
        const [existingItem] = await db.execute('SELECT * FROM inventory_items WHERE id = ?', [id]);
        if (existingItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Get category ID
        const [categoryRows] = await db.execute('SELECT id FROM categories WHERE name = ?', [category]);
        if (categoryRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        const categoryId = categoryRows[0].id;

        const query = `
            UPDATE inventory_items 
            SET name = ?, category_id = ?, quantity = ?, unit = ?, 
                expiration_date = ?, condition = ?, notes = ?
            WHERE id = ?
        `;

        await db.execute(query, [
            name, categoryId, quantity, unit, expiration_date, condition, notes || null, id
        ]);

        // Get the updated item
        const [updatedItem] = await db.execute(`
            SELECT i.*, c.name as category_name 
            FROM inventory_items i 
            JOIN categories c ON i.category_id = c.id 
            WHERE i.id = ?
        `, [id]);

        res.json({
            success: true,
            data: updatedItem[0],
            message: 'Inventory item updated successfully'
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating inventory item'
        });
    }
});

// Delete inventory item
router.delete('/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.execute('DELETE FROM inventory_items WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting inventory item'
        });
    }
});

module.exports = router;