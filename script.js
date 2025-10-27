// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const modal = document.getElementById('itemModal');
const addItemBtn = document.getElementById('addItemBtn');
const closeModal = document.querySelector('.close-modal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const itemForm = document.getElementById('itemForm');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const refreshBtn = document.getElementById('refreshBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const saveSpinner = document.getElementById('saveSpinner');
const saveText = document.getElementById('saveText');

// State variables
let currentEditingId = null;
let categories = [];
let inventoryItems = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing LunchBay application...');
    initializeApp();
});

// Event listeners
addItemBtn.addEventListener('click', () => {
    openModal();
});

closeModal.addEventListener('click', () => {
    closeModalWindow();
});

cancelBtn.addEventListener('click', () => {
    closeModalWindow();
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalWindow();
    }
});

saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (validateForm()) {
        saveItem();
    }
});

searchInput.addEventListener('input', debounce(filterItems, 300));
categoryFilter.addEventListener('change', filterItems);
statusFilter.addEventListener('change', filterItems);
refreshBtn.addEventListener('click', initializeApp);

// Initialize application
async function initializeApp() {
    try {
        showLoading(true);
        console.log('📦 Loading application data...');
        
        // Test connection first
        await testConnection();
        await loadCategories();
        await loadInventory();
        await loadStats();
        
        console.log('✅ Application initialized successfully');
        showLoading(false);
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showToast('Error loading application data. Make sure the backend server is running on port 3000.', 'error');
        showLoading(false);
        
        // Show offline message
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-plug"></i>
                    <p>Cannot connect to server</p>
                    <p style="font-size: 14px; margin-top: 10px;">Make sure the backend server is running on port 3000</p>
                    <div style="margin-top: 15px;">
                        <button class="btn btn-primary" onclick="initializeApp()">
                            <i class="fas fa-sync-alt"></i> Retry Connection
                        </button>
                        <button class="btn btn-outline" onclick="showSetupInstructions()" style="margin-left: 10px;">
                            <i class="fas fa-info-circle"></i> Setup Help
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Show setup instructions
function showSetupInstructions() {
    alert(`To set up the LunchBay backend:

1. Open terminal/command prompt
2. Navigate to the 'backend' folder
3. Run: npm install
4. Run: npm start

You should see: "LunchBay server running on port 3000"

Then refresh this page.`);
}

// Test server connection
async function testConnection() {
    try {
        console.log('🔌 Testing connection to:', `${API_BASE_URL}/health`);
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Server connection successful:', data);
        return true;
    } catch (error) {
        throw new Error(`Cannot connect to server: ${error.message}`);
    }
}

// API functions
async function apiCall(endpoint, options = {}) {
    try {
        console.log(`🔗 Making API call to: ${endpoint}`);
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

        const data = await response.json();
        console.log(`✅ API call successful: ${endpoint}`);
        return data;
    } catch (error) {
        console.error(`❌ API call failed: ${endpoint}`, error);
        throw error;
    }
}

async function loadCategories() {
    try {
        const data = await apiCall('/categories');
        categories = data.data;
        populateCategoryFilters();
    } catch (error) {
        throw new Error('Failed to load categories');
    }
}

async function loadInventory() {
    try {
        const search = searchInput.value.trim();
        const category = categoryFilter.value;
        const status = statusFilter.value;

        let endpoint = '/inventory?';
        const params = new URLSearchParams();

        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (status) params.append('status', status);

        const data = await apiCall(endpoint + params.toString());
        inventoryItems = data.data;
        renderTable();
    } catch (error) {
        throw new Error('Failed to load inventory');
    }
}

async function loadStats() {
    try {
        const data = await apiCall('/inventory/stats');
        updateStats(data.data);
    } catch (error) {
        throw new Error('Failed to load statistics');
    }
}

async function createItem(itemData) {
    return await apiCall('/inventory', {
        method: 'POST',
        body: JSON.stringify(itemData)
    });
}

async function updateItem(id, itemData) {
    return await apiCall(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
    });
}

async function deleteItem(id) {
    return await apiCall(`/inventory/${id}`, {
        method: 'DELETE'
    });
}

// UI functions
function populateCategoryFilters() {
    const categorySelects = [categoryFilter, document.getElementById('itemCategory')];
    
    categorySelects.forEach(select => {
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name.charAt(0).toUpperCase() + category.name.slice(1);
            if (category.description) {
                option.title = category.description;
            }
            select.appendChild(option);
        });
    });
}

function openModal(item = null) {
    modal.style.display = 'flex';
    if (item) {
        document.getElementById('modalTitle').textContent = 'Edit Food Item';
        currentEditingId = item.id;
        populateForm(item);
    } else {
        document.getElementById('modalTitle').textContent = 'Add Food Item';
        currentEditingId = null;
        itemForm.reset();
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expirationDate').min = today;
    }
}

function closeModalWindow() {
    modal.style.display = 'none';
    itemForm.reset();
    currentEditingId = null;
    setSaveButtonState(false);
}

function populateForm(item) {
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category_name;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('expirationDate').value = item.expiration_date;
    document.getElementById('itemCondition').value = item.condition;
    document.getElementById('itemNotes').value = item.notes || '';
}

function validateForm() {
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const quantity = document.getElementById('itemQuantity').value;
    const unit = document.getElementById('itemUnit').value;
    const expirationDate = document.getElementById('expirationDate').value;
    const condition = document.getElementById('itemCondition').value;

    if (!name) {
        showToast('Please enter an item name', 'error');
        return false;
    }
    if (!category) {
        showToast('Please select a category', 'error');
        return false;
    }
    if (!quantity || quantity < 1) {
        showToast('Please enter a valid quantity', 'error');
        return false;
    }
    if (!unit) {
        showToast('Please select a unit', 'error');
        return false;
    }
    if (!expirationDate) {
        showToast('Please select an expiration date', 'error');
        return false;
    }
    if (!condition) {
        showToast('Please select a condition', 'error');
        return false;
    }

    return true;
}

async function saveItem() {
    const formData = {
        name: document.getElementById('itemName').value.trim(),
        category: document.getElementById('itemCategory').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        unit: document.getElementById('itemUnit').value,
        expiration_date: document.getElementById('expirationDate').value,
        condition: document.getElementById('itemCondition').value,
        notes: document.getElementById('itemNotes').value.trim() || null
    };

    setSaveButtonState(true);

    try {
        if (currentEditingId) {
            await updateItem(currentEditingId, formData);
            showToast('Item updated successfully', 'success');
        } else {
            await createItem(formData);
            showToast('Item added successfully', 'success');
        }

        closeModalWindow();
        await loadInventory();
        await loadStats();
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('Error saving item. Make sure the server is running.', 'error');
    } finally {
        setSaveButtonState(false);
    }
}

async function deleteInventoryItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await deleteItem(id);
            showToast('Item deleted successfully', 'success');
            await loadInventory();
            await loadStats();
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast('Error deleting item', 'error');
        }
    }
}

function renderTable() {
    tableBody.innerHTML = '';

    if (inventoryItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No items found matching your criteria</p>
                    <button class="btn btn-primary" id="addFirstItem">
                        <i class="fas fa-plus"></i> Add Your First Item
                    </button>
                </td>
            </tr>
        `;
        
        document.getElementById('addFirstItem')?.addEventListener('click', () => {
            openModal();
        });
        return;
    }

    inventoryItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category_name)}</td>
            <td>${item.quantity} ${escapeHtml(item.unit)}</td>
            <td>${formatDate(item.expiration_date)}</td>
            <td>${capitalizeFirst(item.condition)}</td>
            <td><span class="status-badge status-${item.status}">${getStatusLabel(item.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = inventoryItems.find(item => item.id === id);
            if (item) {
                openModal(item);
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteInventoryItem(id);
        });
    });
}

function filterItems() {
    loadInventory();
}

function updateStats(stats) {
    document.getElementById('expiredCount').textContent = stats.expired;
    document.getElementById('expiringCount').textContent = stats.expiring;
    document.getElementById('freshCount').textContent = stats.fresh;
    document.getElementById('totalCount').textContent = stats.total;
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
        tableBody.innerHTML = '';
    } else {
        loadingIndicator.classList.remove('show');
    }
}

function setSaveButtonState(saving) {
    if (saving) {
        saveSpinner.style.display = 'inline-block';
        saveText.textContent = 'Saving...';
        saveBtn.disabled = true;
    } else {
        saveSpinner.style.display = 'none';
        saveText.textContent = 'Save Item';
        saveBtn.disabled = false;
    }
}

// Utility functions
function getStatusLabel(status) {
    const statuses = {
        'expired': 'Expired',
        'expiring': 'Expires Soon',
        'fresh': 'Fresh'
    };
    return statuses[status] || status;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions globally available for onclick handlers
window.initializeApp = initializeApp;
window.showSetupInstructions = showSetupInstructions;

// Admin State Variables
let adminUsers = [];
let currentSettings = {};

// Admin DOM Elements
const adminBtn = document.querySelector('.user-actions .btn-outline:last-child');
const adminModal = document.getElementById('adminModal');
const adminCancelBtn = document.getElementById('adminCancelBtn');
const adminSaveBtn = document.getElementById('adminSaveBtn');
const addUserModal = document.getElementById('addUserModal');
const addUserBtn = document.getElementById('addUserBtn');
const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
const saveUserBtn = document.getElementById('saveUserBtn');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const systemRefreshBtn = document.getElementById('systemRefreshBtn');
const backupNowBtn = document.getElementById('backupNowBtn');

// Initialize Admin System
function initializeAdminSystem() {
    setupAdminEventListeners();
    loadAdminData();
}

// Setup Admin Event Listeners
function setupAdminEventListeners() {
    // Admin button click
    adminBtn.addEventListener('click', openAdminPanel);
    
    // Admin modal controls
    adminCancelBtn.addEventListener('click', closeAdminPanel);
    adminSaveBtn.addEventListener('click', saveAdminSettings);
    
    // Tab functionality
    setupTabSwitching();
    
    // User management
    addUserBtn.addEventListener('click', openAddUserModal);
    cancelAddUserBtn.addEventListener('click', closeAddUserModal);
    saveUserBtn.addEventListener('click', saveNewUser);
    refreshUsersBtn.addEventListener('click', loadUsers);
    
    // Reports
    generateReportBtn.addEventListener('click', generateReport);
    
    // System
    systemRefreshBtn.addEventListener('click', refreshSystemInfo);
    backupNowBtn.addEventListener('click', createBackup);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) closeAdminPanel();
        if (e.target === addUserModal) closeAddUserModal();
    });
}

// Tab Switching Functionality
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to current button and pane
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Admin Panel Functions
function openAdminPanel() {
    console.log('Opening admin panel...');
    adminModal.style.display = 'flex';
    loadAdminData();
}

function closeAdminPanel() {
    adminModal.style.display = 'none';
}

async function loadAdminData() {
    try {
        await loadUsers();
        await loadSettings();
        await loadSystemInfo();
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Error loading admin data', 'error');
    }
}

// User Management
async function loadUsers() {
    try {
        // Mock data - replace with actual API call
        adminUsers = [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@foodshare.com',
                role: 'admin',
                lastLogin: '2023-10-15 14:30:00',
                status: 'active'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@foodshare.com',
                role: 'manager',
                lastLogin: '2023-10-14 09:15:00',
                status: 'active'
            },
            {
                id: 3,
                name: 'Bob Wilson',
                email: 'bob@foodshare.com',
                role: 'user',
                lastLogin: '2023-10-13 16:45:00',
                status: 'active'
            }
        ];
        
        renderUserList();
        updateUserStats();
    } catch (error) {
        throw new Error('Failed to load users');
    }
}

function renderUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    if (adminUsers.length === 0) {
        userList.innerHTML = `
            <div class="empty-state" style="padding: 20px; text-align: center;">
                <i class="fas fa-users"></i>
                <p>No users found</p>
            </div>
        `;
        return;
    }
    
    adminUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-info">
                <h4>${escapeHtml(user.name)}</h4>
                <p>${escapeHtml(user.email)} • Last login: ${formatDateTime(user.lastLogin)}</p>
            </div>
            <div class="user-actions">
                <span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span>
                <button class="btn-icon btn-edit-user" data-id="${user.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete-user" data-id="${user.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        userList.appendChild(userItem);
    });
    
    // Add event listeners to user action buttons
    document.querySelectorAll('.btn-edit-user').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.getAttribute('data-id'));
            editUser(userId);
        });
    });
    
    document.querySelectorAll('.btn-delete-user').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteUser(userId);
        });
    });
}

function updateUserStats() {
    document.getElementById('totalUsers').textContent = adminUsers.length;
}

function openAddUserModal() {
    addUserModal.style.display = 'flex';
    document.getElementById('addUserForm').reset();
}

function closeAddUserModal() {
    addUserModal.style.display = 'none';
}

async function saveNewUser() {
    const formData = {
        name: document.getElementById('newUserName').value.trim(),
        email: document.getElementById('newUserEmail').value.trim(),
        role: document.getElementById('newUserRole').value,
        password: document.getElementById('newUserPassword').value
    };
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Mock API call - replace with actual implementation
        const newUser = {
            id: Math.max(...adminUsers.map(u => u.id)) + 1,
            ...formData,
            lastLogin: 'Never',
            status: 'active'
        };
        
        adminUsers.push(newUser);
        renderUserList();
        updateUserStats();
        closeAddUserModal();
        showToast('User created successfully', 'success');
    } catch (error) {
        showToast('Error creating user', 'error');
    }
}

function editUser(userId) {
    const user = adminUsers.find(u => u.id === userId);
    if (user) {
        // For demo purposes, we'll just show an alert
        // In a real app, you'd open an edit modal
        alert(`Edit user: ${user.name}\nThis would open an edit form in a real application.`);
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            // Mock deletion - replace with actual API call
            adminUsers = adminUsers.filter(u => u.id !== userId);
            renderUserList();
            updateUserStats();
            showToast('User deleted successfully', 'success');
        } catch (error) {
            showToast('Error deleting user', 'error');
        }
    }
}

// Settings Management
async function loadSettings() {
    try {
        // Mock settings - replace with actual API call
        currentSettings = {
            expirationAlertDays: 3,
            autoBackup: 'weekly',
            emailNotifications: true
        };
        
        // Populate settings form
        document.getElementById('expirationAlertDays').value = currentSettings.expirationAlertDays;
        document.getElementById('autoBackup').value = currentSettings.autoBackup;
        document.getElementById('emailNotifications').checked = currentSettings.emailNotifications;
    } catch (error) {
        throw new Error('Failed to load settings');
    }
}

async function saveAdminSettings() {
    try {
        const newSettings = {
            expirationAlertDays: parseInt(document.getElementById('expirationAlertDays').value),
            autoBackup: document.getElementById('autoBackup').value,
            emailNotifications: document.getElementById('emailNotifications').checked
        };
        
        // Mock API call - replace with actual implementation
        currentSettings = newSettings;
        
        showToast('Settings saved successfully', 'success');
        setTimeout(() => {
            closeAdminPanel();
        }, 1000);
    } catch (error) {
        showToast('Error saving settings', 'error');
    }
}

// Reports Management
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', 'error');
        return;
    }
    
    try {
        // Mock report generation
        const reportContent = generateMockReport(reportType, startDate, endDate);
        
        document.getElementById('reportContent').innerHTML = reportContent;
        document.getElementById('reportPreview').style.display = 'block';
        
        showToast('Report generated successfully', 'success');
    } catch (error) {
        showToast('Error generating report', 'error');
    }
}

function generateMockReport(type, startDate, endDate) {
    const reports = {
        waste: `
            <div class="report-section">
                <h5>Food Waste Analysis (${startDate} to ${endDate})</h5>
                <p>Total Waste: <strong>1,250 lbs</strong></p>
                <p>Waste Reduction: <strong style="color: var(--success);">28%</strong> compared to previous period</p>
                <p>Top Wasted Items:</p>
                <ul>
                    <li>Bread (180 lbs)</li>
                    <li>Vegetables (150 lbs)</li>
                    <li>Dairy (120 lbs)</li>
                </ul>
            </div>
        `,
        donations: `
            <div class="report-section">
                <h5>Donation Impact Report (${startDate} to ${endDate})</h5>
                <p>Total Donations: <strong>850 meals</strong></p>
                <p>Food Saved: <strong>720 lbs</strong></p>
                <p>Carbon Emissions Avoided: <strong>1.2 tons CO₂</strong></p>
                <p>Partner Organizations Served: <strong>8</strong></p>
            </div>
        `,
        inventory: `
            <div class="report-section">
                <h5>Inventory Trends (${startDate} to ${endDate})</h5>
                <p>Average Inventory Turnover: <strong>4.2 days</strong></p>
                <p>Stock Accuracy: <strong>94%</strong></p>
                <p>Expiration Alerts: <strong>42</strong></p>
                <p>Automated Reordering: <strong>68% of items</strong></p>
            </div>
        `,
        users: `
            <div class="report-section">
                <h5>User Activity Report (${startDate} to ${endDate})</h5>
                <p>Active Users: <strong>24</strong></p>
                <p>Total Logins: <strong>342</strong></p>
                <p>Most Active User: <strong>Jane Smith (48 logins)</strong></p>
                <p>Features Used:</p>
                <ul>
                    <li>Inventory Management: 89% of users</li>
                    <li>Reporting: 67% of users</li>
                    <li>Donation Tracking: 72% of users</li>
                </ul>
            </div>
        `
    };
    
    return reports[type] || '<p>No data available for this report type.</p>';
}

// System Management
async function loadSystemInfo() {
    try {
        // Mock system info - replace with actual API call
        document.getElementById('serverStatus').textContent = 'Online';
        document.getElementById('serverStatus').className = 'stat-value online';
        document.getElementById('dbStatus').textContent = 'Connected';
        document.getElementById('storageUsed').textContent = '245 MB';
        document.getElementById('lastBackup').textContent = '2023-10-15 02:00:00';
    } catch (error) {
        document.getElementById('serverStatus').textContent = 'Offline';
        document.getElementById('serverStatus').className = 'stat-value offline';
        document.getElementById('dbStatus').textContent = 'Disconnected';
    }
}

async function refreshSystemInfo() {
    showToast('Refreshing system information...', 'warning');
    await loadSystemInfo();
    showToast('System information updated', 'success');
}

async function createBackup() {
    try {
        // Mock backup process
        showToast('Creating system backup...', 'warning');
        
        // Simulate backup process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        document.getElementById('lastBackup').textContent = new Date().toLocaleString();
        showToast('Backup completed successfully', 'success');
    } catch (error) {
        showToast('Backup failed', 'error');
    }
}

// Utility Functions
function formatDateTime(dateTimeString) {
    if (!dateTimeString || dateTimeString === 'Never') return 'Never';
    
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Initialize admin system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminSystem();
    // ... rest of your existing initialization code
});