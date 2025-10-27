// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const quickAddBtn = document.getElementById('quickAddBtn');
const quickAddModal = document.getElementById('quickAddModal');
const cancelQuickAddBtn = document.getElementById('cancelQuickAddBtn');
const saveQuickAddBtn = document.getElementById('saveQuickAddBtn');
const quickAddForm = document.getElementById('quickAddForm');

// Chart instances
let statusChart, wasteChart, categoryChart, expirationChart;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing LunchBay Dashboard...');
    initializeDashboard();
});

// Event listeners
refreshBtn.addEventListener('click', initializeDashboard);
quickAddBtn.addEventListener('click', openQuickAddModal);
cancelQuickAddBtn.addEventListener('click', closeQuickAddModal);
saveQuickAddBtn.addEventListener('click', saveQuickAddItem);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === quickAddModal) {
        closeQuickAddModal();
    }
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        showLoading(true);
        console.log('📊 Loading dashboard data...');
        
        await testConnection();
        await loadDashboardData();
        await loadActivityFeed();
        await loadAlerts();
        
        console.log('✅ Dashboard initialized successfully');
        showLoading(false);
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showToast('Error loading dashboard data. Make sure the backend server is running.', 'error');
        showLoading(false);
        showOfflineState();
    }
}

// Test server connection
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Server connection successful');
        return true;
    } catch (error) {
        throw new Error(`Cannot connect to server: ${error.message}`);
    }
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        const [inventoryData, statsData, categoriesData] = await Promise.all([
            apiCall('/inventory'),
            apiCall('/inventory/stats'),
            apiCall('/categories')
        ]);

        updateQuickStats(inventoryData.data, statsData.data);
        createCharts(inventoryData.data, statsData.data, categoriesData.data);
        calculateImpactMetrics(inventoryData.data);
        
    } catch (error) {
        throw new Error('Failed to load dashboard data');
    }
}

// Update quick stats
function updateQuickStats(inventory, stats) {
    document.getElementById('totalItems').textContent = stats.total;
    document.getElementById('costSavings').textContent = calculateCostSavings(stats);
    document.getElementById('mealsDonated').textContent = calculateMealsDonated(inventory);
}

// Calculate cost savings based on waste reduction
function calculateCostSavings(stats) {
    // Assume average cost per item is $5
    const wasteReduction = stats.expired * 5 * 0.7; // 70% of potential waste saved
    return `$${Math.round(wasteReduction)}`;
}

// Calculate meals donated
function calculateMealsDonated(inventory) {
    // Assume each serving provides one meal
    const donatedItems = inventory.filter(item => item.status === 'expiring' && item.unit === 'servings');
    return donatedItems.reduce((total, item) => total + item.quantity, 0);
}

// Create charts
function createCharts(inventory, stats, categories) {
    createStatusChart(stats);
    createWasteChart();
    createCategoryChart(inventory, categories);
    createExpirationChart(inventory);
}

// Status Distribution Chart (Doughnut)
function createStatusChart(stats) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fresh', 'Expiring Soon', 'Expired'],
            datasets: [{
                data: [stats.fresh, stats.expiring, stats.expired],
                backgroundColor: [
                    '#4CAF50', // Green for fresh
                    '#FF9800', // Orange for expiring
                    '#F44336'  // Red for expired
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Waste Reduction Chart (Line)
function createWasteChart() {
    const ctx = document.getElementById('wasteChart').getContext('2d');
    
    if (wasteChart) {
        wasteChart.destroy();
    }
    
    // Mock data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const wasteData = [45, 38, 32, 28, 24, 20]; // Decreasing waste
    const donationsData = [15, 18, 22, 25, 28, 32]; // Increasing donations
    
    wasteChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Food Waste (lbs)',
                    data: wasteData,
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Food Donated (lbs)',
                    data: donationsData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Pounds (lbs)'
                    }
                }
            }
        }
    });
}

// Category Distribution Chart (Bar)
function createCategoryChart(inventory, categories) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Count items by category
    const categoryCounts = {};
    categories.forEach(cat => {
        categoryCounts[cat.name] = 0;
    });
    
    inventory.forEach(item => {
        if (categoryCounts[item.category_name] !== undefined) {
            categoryCounts[item.category_name]++;
        }
    });
    
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(cat => cat.name.charAt(0).toUpperCase() + cat.name.slice(1)),
            datasets: [{
                label: 'Items by Category',
                data: categories.map(cat => categoryCounts[cat.name]),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Expiration Timeline Chart
function createExpirationChart(inventory) {
    const ctx = document.getElementById('expirationChart').getContext('2d');
    
    if (expirationChart) {
        expirationChart.destroy();
    }
    
    // Group items by days until expiration
    const today = new Date();
    const expirationGroups = {
        'Expired': 0,
        'Today': 0,
        '1-3 Days': 0,
        '4-7 Days': 0,
        '1-2 Weeks': 0,
        '2+ Weeks': 0
    };
    
    inventory.forEach(item => {
        const expDate = new Date(item.expiration_date);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            expirationGroups['Expired']++;
        } else if (diffDays === 0) {
            expirationGroups['Today']++;
        } else if (diffDays <= 3) {
            expirationGroups['1-3 Days']++;
        } else if (diffDays <= 7) {
            expirationGroups['4-7 Days']++;
        } else if (diffDays <= 14) {
            expirationGroups['1-2 Weeks']++;
        } else {
            expirationGroups['2+ Weeks']++;
        }
    });
    
    expirationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(expirationGroups),
            datasets: [{
                label: 'Items Expiring',
                data: Object.values(expirationGroups),
                backgroundColor: function(context) {
                    const index = context.dataIndex;
                    const value = context.dataset.data[index];
                    const colors = [
                        '#F44336', // Expired - Red
                        '#FF5722', // Today - Deep Orange
                        '#FF9800', // 1-3 Days - Orange
                        '#FFC107', // 4-7 Days - Amber
                        '#8BC34A', // 1-2 Weeks - Light Green
                        '#4CAF50'  // 2+ Weeks - Green
                    ];
                    return colors[index];
                },
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load activity feed
async function loadActivityFeed() {
    try {
        const inventoryData = await apiCall('/inventory');
        const activityFeed = document.getElementById('activityFeed');
        
        // Generate activity from recent inventory changes
        const activities = generateActivityData(inventoryData.data);
        
        if (activities.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-dashboard">
                    <i class="fas fa-history"></i>
                    <h3>No Recent Activity</h3>
                    <p>Activity will appear here as you manage your inventory</p>
                </div>
            `;
            return;
        }
        
        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading activity feed:', error);
    }
}

// Generate mock activity data
function generateActivityData(inventory) {
    const activities = [];
    const now = new Date();
    
    // Recent items added
    const recentItems = inventory
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
    
    recentItems.forEach(item => {
        activities.push({
            type: 'add',
            icon: 'plus',
            title: 'New Item Added',
            description: `Added ${item.quantity} ${item.unit} of ${item.name}`,
            time: formatRelativeTime(new Date(item.created_at))
        });
    });
    
    // Expiring soon items
    const expiringItems = inventory.filter(item => item.status === 'expiring').slice(0, 2);
    expiringItems.forEach(item => {
        activities.push({
            type: 'expired',
            icon: 'exclamation-triangle',
            title: 'Item Expiring Soon',
            description: `${item.name} expires in less than 3 days`,
            time: formatRelativeTime(new Date())
        });
    });
    
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
}

// Load alerts
async function loadAlerts() {
    try {
        const inventoryData = await apiCall('/inventory');
        const alertsContainer = document.getElementById('alertsContainer');
        
        const alerts = generateAlerts(inventoryData.data);
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="empty-dashboard">
                    <i class="fas fa-check-circle"></i>
                    <h3>No Priority Alerts</h3>
                    <p>Everything looks good! No urgent actions needed.</p>
                </div>
            `;
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-icon">
                    <i class="fas fa-${alert.icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-description">${alert.description}</div>
                    <div class="alert-action" onclick="${alert.action}">${alert.actionText}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Generate alerts based on inventory status
function generateAlerts(inventory) {
    const alerts = [];
    
    // Expired items alert
    const expiredItems = inventory.filter(item => item.status === 'expired');
    if (expiredItems.length > 0) {
        alerts.push({
            severity: 'critical',
            icon: 'exclamation-circle',
            title: `${expiredItems.length} Expired Items`,
            description: 'These items need immediate attention and should be disposed of properly.',
            action: 'location.href=\'index.html?status=expired\'',
            actionText: 'View Expired Items'
        });
    }
    
    // Items expiring today
    const today = new Date().toISOString().split('T')[0];
    const expiringToday = inventory.filter(item => item.expiration_date === today);
    if (expiringToday.length > 0) {
        alerts.push({
            severity: 'warning',
            icon: 'clock',
            title: `${expiringToday.length} Items Expire Today`,
            description: 'Consider donating these items or using them immediately.',
            action: 'location.href=\'index.html?status=expiring\'',
            actionText: 'View Expiring Items'
        });
    }
    
    // Low stock alert (example)
    const lowStockItems = inventory.filter(item => item.quantity < 5);
    if (lowStockItems.length > 3) {
        alerts.push({
            severity: 'info',
            icon: 'shopping-cart',
            title: 'Low Stock Alert',
            description: `${lowStockItems.length} items are running low. Consider restocking.`,
            action: 'location.href=\'index.html\'',
            actionText: 'View Inventory'
        });
    }
    
    return alerts;
}

// Quick Add Modal Functions
function openQuickAddModal() {
    quickAddModal.style.display = 'flex';
    quickAddForm.reset();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('quickExpirationDate').min = today;
    document.getElementById('quickExpirationDate').value = today;
}

function closeQuickAddModal() {
    quickAddModal.style.display = 'none';
    quickAddForm.reset();
}

async function saveQuickAddItem() {
    const formData = {
        name: document.getElementById('quickItemName').value.trim(),
        category: 'other', // Default category for quick add
        quantity: parseInt(document.getElementById('quickItemQuantity').value),
        unit: document.getElementById('quickItemUnit').value,
        expiration_date: document.getElementById('quickExpirationDate').value,
        condition: 'good', // Default condition for quick add
        notes: 'Added via Quick Add'
    };

    // Basic validation
    if (!formData.name || !formData.quantity || !formData.unit || !formData.expiration_date) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        await apiCall('/inventory', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showToast('Item added successfully', 'success');
        closeQuickAddModal();
        
        // Refresh dashboard data
        await initializeDashboard();
        
    } catch (error) {
        console.error('Error adding item:', error);
        showToast('Error adding item', 'error');
    }
}

// Calculate impact metrics
function calculateImpactMetrics(inventory) {
    // These would be more complex calculations in a real app
    const environmentalImpact = {
        co2Reduced: inventory.length * 2.5, // kg CO2
        waterSaved: inventory.length * 1300, // liters
        landSaved: inventory.length * 2.8    // square meters
    };
    
    // You could display these in additional dashboard widgets
    console.log('Environmental Impact:', environmentalImpact);
}

// Utility Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type, 'show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

function showLoading(show) {
    if (show) {
        loadingIndicator.classList.add('show');
    } else {
        loadingIndicator.classList.remove('show');
    }
}

function showOfflineState() {
    const main = document.querySelector('main');
    main.innerHTML = `
        <div class="empty-dashboard">
            <i class="fas fa-plug"></i>
            <h3>Dashboard Unavailable</h3>
            <p>Unable to connect to the server. Please check your connection and try again.</p>
            <button class="btn btn-primary" onclick="initializeDashboard()">
                <i class="fas fa-sync-alt"></i> Retry Connection
            </button>
        </div>
    `;
}

// Make functions globally available
window.initializeDashboard = initializeDashboard;