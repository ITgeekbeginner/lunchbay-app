const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test route - ALWAYS works
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'OK', 
        message: 'LunchBay API is running!',
        timestamp: new Date().toISOString()
    });
});

// Mock data for testing
const mockInventory = [
    {
        id: 1,
        name: "Leftover Pizza",
        category_name: "prepared",
        quantity: 5,
        unit: "servings",
        expiration_date: "2025-10-15",
        condition: "good",
        status: "expired",
        notes: "From yesterday's event"
    },
    {
        id: 2,
        name: "Fresh Salad",
        category_name: "fruits",
        quantity: 2,
        unit: "lbs",
        expiration_date: "2025-10-18",
        condition: "excellent",
        status: "expiring",
        notes: ""
    },
    {
        id: 3,
        name: "Milk",
        category_name: "dairy",
        quantity: 1,
        unit: "gallons",
        expiration_date: "2025-10-25",
        condition: "good",
        status: "fresh",
        notes: ""
    }
];

// Mock API routes
app.get('/api/inventory', (req, res) => {
    const { search, category, status } = req.query;
    
    let filteredItems = [...mockInventory];
    
    if (search) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    if (category) {
        filteredItems = filteredItems.filter(item => 
            item.category_name === category
        );
    }
    
    if (status) {
        filteredItems = filteredItems.filter(item => 
            item.status === status
        );
    }
    
    res.json({
        success: true,
        data: filteredItems,
        total: filteredItems.length
    });
});

app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        data: [
            { name: 'fruits', description: 'Fruits and Vegetables' },
            { name: 'dairy', description: 'Dairy Products' },
            { name: 'meat', description: 'Meat and Poultry' },
            { name: 'bakery', description: 'Bakery Items' },
            { name: 'prepared', description: 'Prepared Foods' },
            { name: 'beverages', description: 'Beverages' },
            { name: 'other', description: 'Other Food Items' }
        ]
    });
});

app.get('/api/inventory/stats', (req, res) => {
    const stats = {
        expired: mockInventory.filter(item => item.status === 'expired').length,
        expiring: mockInventory.filter(item => item.status === 'expiring').length,
        fresh: mockInventory.filter(item => item.status === 'fresh').length,
        total: mockInventory.length
    };
    
    res.json({
        success: true,
        data: stats
    });
});

// Mock POST, PUT, DELETE routes
app.post('/api/inventory', (req, res) => {
    const newItem = {
        id: mockInventory.length + 1,
        ...req.body,
        category_name: req.body.category,
        status: calculateStatus(req.body.expiration_date)
    };
    
    mockInventory.push(newItem);
    
    res.json({
        success: true,
        data: newItem,
        message: 'Item created successfully'
    });
});

app.put('/api/inventory/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = mockInventory.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Item not found'
        });
    }
    
    mockInventory[itemIndex] = {
        ...mockInventory[itemIndex],
        ...req.body,
        category_name: req.body.category,
        status: calculateStatus(req.body.expiration_date)
    };
    
    res.json({
        success: true,
        data: mockInventory[itemIndex],
        message: 'Item updated successfully'
    });
});

app.delete('/api/inventory/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = mockInventory.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Item not found'
        });
    }
    
    mockInventory.splice(itemIndex, 1);
    
    res.json({
        success: true,
        message: 'Item deleted successfully'
    });
});

function calculateStatus(expirationDate) {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const timeDiff = expDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'expired';
    if (daysDiff <= 3) return 'expiring';
    return 'fresh';
}

// Admin routes
app.get('/api/admin/users', (req, res) => {
    const mockUsers = [
        {
            id: 1,
            name: 'System Administrator',
            email: 'admin@lunchbay.com',
            role: 'admin',
            lastLogin: new Date().toISOString(),
            status: 'active'
        }
    ];
    
    res.json({
        success: true,
        data: mockUsers
    });
});

app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalUsers: 1,
            totalInventory: mockInventory.length,
            totalCategories: 7,
            storageUsed: '245 MB',
            lastBackup: new Date().toISOString()
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LunchBay server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Mock data loaded with ${mockInventory.length} items`);
});