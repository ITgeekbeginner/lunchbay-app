// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const newDonationBtn = document.getElementById('newDonationBtn');
const bulkDonateBtn = document.getElementById('bulkDonateBtn');
const schedulePickupBtn = document.getElementById('schedulePickupBtn');
const donationModal = document.getElementById('donationModal');
const cancelDonationBtn = document.getElementById('cancelDonationBtn');
const saveDonationBtn = document.getElementById('saveDonationBtn');
const donationForm = document.getElementById('donationForm');
const donationDetailsModal = document.getElementById('donationDetailsModal');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');

// State variables
let donations = [];
let recipients = [];
let availableItems = [];
let selectedItems = [];
let currentEditingId = null;

// Initialize donations page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Donations page...');
    initializeDonations();
});

// Event listeners
refreshBtn.addEventListener('click', initializeDonations);
newDonationBtn.addEventListener('click', openDonationModal);
bulkDonateBtn.addEventListener('click', handleBulkDonate);
schedulePickupBtn.addEventListener('click', openDonationModal);
cancelDonationBtn.addEventListener('click', closeDonationModal);
saveDonationBtn.addEventListener('click', saveDonation);
closeDetailsBtn.addEventListener('click', closeDonationDetails);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === donationModal) closeDonationModal();
    if (e.target === donationDetailsModal) closeDonationDetails();
});

// Search and filter functionality
document.getElementById('searchDonations').addEventListener('input', debounce(filterDonations, 300));
document.getElementById('statusFilter').addEventListener('change', filterDonations);
document.getElementById('recipientFilter').addEventListener('change', filterDonations);

// Initialize donations
async function initializeDonations() {
    try {
        showLoading(true);
        console.log('📦 Loading donations data...');
        
        await testConnection();
        await loadDonations();
        await loadRecipients();
        await loadAvailableItems();
        updateDonationStats();
        
        console.log('✅ Donations initialized successfully');
        showLoading(false);
    } catch (error) {
        console.error('❌ Error initializing donations:', error);
        showToast('Error loading donations data. Make sure the backend server is running.', 'error');
        showLoading(false);
        showOfflineState();
    }
}

// Test server connection
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        return true;
    } catch (error) {
        throw new Error(`Cannot connect to server: ${error.message}`);
    }
}

// Load donations data
async function loadDonations() {
    try {
        // Mock data - replace with actual API call
        donations = [
            {
                id: 1,
                recipient_id: 1,
                recipient_name: 'City Food Bank',
                items: [
                    { name: 'Fresh Salad', quantity: 5, unit: 'lbs' },
                    { name: 'Bread Rolls', quantity: 12, unit: 'pieces' }
                ],
                total_weight: 8,
                scheduled_date: '2025-10-29T11:00:00',
                status: 'scheduled',
                impact: { meals: 25, co2_reduced: 4.2 }
            },
            {
                id: 2,
                recipient_id: 2,
                recipient_name: 'Community Shelter',
                items: [
                    { name: 'Leftover Pizza', quantity: 3, unit: 'servings' },
                    { name: 'Milk', quantity: 1, unit: 'gallons' }
                ],
                total_weight: 5,
                scheduled_date: '2025-10-26T10:00:00',
                status: 'completed',
                impact: { meals: 15, co2_reduced: 2.8 }
            },
            {
                id: 3,
                recipient_id: 3,
                recipient_name: 'Youth Center',
                items: [
                    { name: 'Chicken Breast', quantity: 4, unit: 'lbs' },
                    { name: 'Vegetable Soup', quantity: 8, unit: 'servings' }
                ],
                total_weight: 6,
                scheduled_date: '2025-10-29T16:00:00',
                status: 'in-progress',
                impact: { meals: 20, co2_reduced: 3.5 }
            }
        ];
        
        renderDonationsTable();
        populateRecipientFilter();
    } catch (error) {
        throw new Error('Failed to load donations');
    }
}

// Load recipients for donation form
async function loadRecipients() {
    try {
        // Mock data - replace with actual API call
        recipients = [
            { id: 1, name: 'City Food Bank', type: 'food-bank' },
            { id: 2, name: 'Community Shelter', type: 'shelter' },
            { id: 3, name: 'Youth Center', type: 'community-center' },
            { id: 4, name: 'Senior Center', type: 'community-center' },
            { id: 5, name: 'Homeless Outreach', type: 'non-profit' }
        ];
        
        populateRecipientDropdown();
    } catch (error) {
        throw new Error('Failed to load recipients');
    }
}

// Load available items for donation
async function loadAvailableItems() {
    try {
        const data = await apiCall('/inventory');
        // Filter for items that are expiring soon or fresh (not expired)
        availableItems = data.data.filter(item => item.status !== 'expired');
        renderAvailableItems();
    } catch (error) {
        throw new Error('Failed to load available items');
    }
}

// Render donations table
function renderDonationsTable() {
    const donationsBody = document.getElementById('donationsBody');
    
    if (donations.length === 0) {
        donationsBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-hand-holding-heart"></i>
                    <p>No donations found</p>
                    <button class="btn btn-primary" onclick="openDonationModal()">
                        <i class="fas fa-plus"></i> Create First Donation
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    donationsBody.innerHTML = donations.map(donation => `
        <tr>
            <td>#D${donation.id.toString().padStart(4, '0')}</td>
            <td>${escapeHtml(donation.recipient_name)}</td>
            <td>
                <div class="item-list">
                    ${donation.items.map(item => 
                        `<span class="item-tag">${item.quantity} ${item.unit} ${item.name}</span>`
                    ).join('')}
                </div>
            </td>
            <td>${donation.total_weight} lbs</td>
            <td>${formatDateTime(donation.scheduled_date)}</td>
            <td><span class="status-badge status-${donation.status}">${getStatusLabel(donation.status)}</span></td>
            <td>
                <div class="impact-metrics">
                    <small>${donation.impact.meals} meals</small>
                    <small>${donation.impact.co2_reduced} kg CO₂</small>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" data-id="${donation.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" data-id="${donation.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-cancel" data-id="${donation.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            viewDonationDetails(id);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            editDonation(id);
        });
    });
    
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            cancelDonation(id);
        });
    });
}

// Populate recipient dropdown
function populateRecipientDropdown() {
    const dropdown = document.getElementById('donationRecipient');
    dropdown.innerHTML = '<option value="">Select Recipient</option>';
    
    recipients.forEach(recipient => {
        const option = document.createElement('option');
        option.value = recipient.id;
        option.textContent = recipient.name;
        dropdown.appendChild(option);
    });
}

// Populate recipient filter
function populateRecipientFilter() {
    const filter = document.getElementById('recipientFilter');
    filter.innerHTML = '<option value="">All Recipients</option>';
    
    const uniqueRecipients = [...new Set(donations.map(d => d.recipient_name))];
    uniqueRecipients.forEach(recipient => {
        const option = document.createElement('option');
        option.value = recipient;
        option.textContent = recipient;
        filter.appendChild(option);
    });
}

// Render available items for donation
function renderAvailableItems() {
    const container = document.getElementById('availableItems');
    
    if (availableItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <i class="fas fa-inbox"></i>
                <p>No items available for donation</p>
                <small>Add some inventory items first</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableItems.map(item => `
        <div class="item-checkbox">
            <input type="checkbox" id="item-${item.id}" value="${item.id}" 
                   onchange="toggleItemSelection(${item.id})">
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-details">
                    ${item.quantity} ${item.unit} • Expires: ${formatDate(item.expiration_date)} • 
                    <span class="status-${item.status}">${getStatusLabel(item.status)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle item selection
function toggleItemSelection(itemId) {
    const checkbox = document.getElementById(`item-${itemId}`);
    const item = availableItems.find(i => i.id === itemId);
    
    if (checkbox.checked) {
        selectedItems.push({ ...item, donation_quantity: item.quantity });
    } else {
        selectedItems = selectedItems.filter(i => i.id !== itemId);
    }
    
    updateSelectedItemsDisplay();
}

// Update selected items display
function updateSelectedItemsDisplay() {
    const section = document.getElementById('selectedItemsSection');
    const list = document.getElementById('selectedItemsList');
    const summary = document.getElementById('donationSummary');
    
    if (selectedItems.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    // Update selected items list
    list.innerHTML = selectedItems.map(item => `
        <div class="selected-item">
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-details">${item.donation_quantity} ${item.unit}</div>
            </div>
            <button class="btn-icon btn-remove" onclick="removeSelectedItem(${item.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Update summary
    const totalWeight = selectedItems.reduce((sum, item) => sum + (item.donation_quantity * 0.5), 0); // Mock weight calculation
    const totalMeals = selectedItems.reduce((sum, item) => {
        if (item.unit === 'servings') return sum + item.donation_quantity;
        return sum + Math.floor(item.donation_quantity * 2); // Mock meal calculation
    }, 0);
    
    summary.innerHTML = `
        <div class="summary-item">
            <span>Total Items:</span>
            <span>${selectedItems.length}</span>
        </div>
        <div class="summary-item">
            <span>Estimated Weight:</span>
            <span>${totalWeight.toFixed(1)} lbs</span>
        </div>
        <div class="summary-item">
            <span>Estimated Meals:</span>
            <span>${totalMeals}</span>
        </div>
        <div class="summary-total">
            <span>CO₂ Reduction:</span>
            <span>${(totalWeight * 0.5).toFixed(1)} kg</span>
        </div>
    `;
}

// Remove selected item
function removeSelectedItem(itemId) {
    selectedItems = selectedItems.filter(i => i.id !== itemId);
    const checkbox = document.getElementById(`item-${itemId}`);
    if (checkbox) checkbox.checked = false;
    updateSelectedItemsDisplay();
}

// Open donation modal
function openDonationModal() {
    donationModal.style.display = 'flex';
    document.getElementById('donationModalTitle').textContent = 'New Donation';
    currentEditingId = null;
    donationForm.reset();
    selectedItems = [];
    updateSelectedItemsDisplay();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('donationDate').value = tomorrow.toISOString().slice(0, 16);
}

// Close donation modal
function closeDonationModal() {
    donationModal.style.display = 'none';
    donationForm.reset();
    selectedItems = [];
    currentEditingId = null;
}

// Save donation
async function saveDonation() {
    const formData = {
        recipient_id: parseInt(document.getElementById('donationRecipient').value),
        scheduled_date: document.getElementById('donationDate').value,
        items: selectedItems.map(item => ({
            item_id: item.id,
            quantity: item.donation_quantity,
            unit: item.unit
        })),
        status: 'scheduled'
    };
    
    // Validation
    if (!formData.recipient_id) {
        showToast('Please select a recipient organization', 'error');
        return;
    }
    
    if (!formData.scheduled_date) {
        showToast('Please select a scheduled date', 'error');
        return;
    }
    
    if (formData.items.length === 0) {
        showToast('Please select at least one item to donate', 'error');
        return;
    }
    
    try {
        // Mock API call - replace with actual implementation
        const newDonation = {
            id: donations.length + 1,
            recipient_name: recipients.find(r => r.id === formData.recipient_id)?.name || 'Unknown',
            items: selectedItems.map(item => ({
                name: item.name,
                quantity: item.donation_quantity,
                unit: item.unit
            })),
            total_weight: selectedItems.reduce((sum, item) => sum + (item.donation_quantity * 0.5), 0),
            scheduled_date: formData.scheduled_date,
            status: formData.status,
            impact: {
                meals: selectedItems.reduce((sum, item) => {
                    if (item.unit === 'servings') return sum + item.donation_quantity;
                    return sum + Math.floor(item.donation_quantity * 2);
                }, 0),
                co2_reduced: selectedItems.reduce((sum, item) => sum + (item.donation_quantity * 0.5 * 0.5), 0)
            }
        };
        
        donations.push(newDonation);
        
        showToast('Donation scheduled successfully!', 'success');
        closeDonationModal();
        
        // Refresh the page
        await initializeDonations();
        
    } catch (error) {
        console.error('Error saving donation:', error);
        showToast('Error scheduling donation', 'error');
    }
}

// Handle bulk donation
function handleBulkDonate() {
    // Auto-select expiring items
    const expiringItems = availableItems.filter(item => item.status === 'expiring');
    
    expiringItems.forEach(item => {
        const checkbox = document.getElementById(`item-${item.id}`);
        if (checkbox) {
            checkbox.checked = true;
            toggleItemSelection(item.id);
        }
    });
    
    if (expiringItems.length > 0) {
        openDonationModal();
        showToast(`Auto-selected ${expiringItems.length} expiring items for donation`, 'info');
    } else {
        showToast('No expiring items available for bulk donation', 'warning');
    }
}

// View donation details
function viewDonationDetails(id) {
    const donation = donations.find(d => d.id === id);
    if (!donation) return;
    
    const content = document.getElementById('donationDetailsContent');
    content.innerHTML = `
        <div class="donation-details">
            <div class="detail-section">
                <h4>Recipient Information</h4>
                <p><strong>Organization:</strong> ${donation.recipient_name}</p>
            </div>
            
            <div class="detail-section">
                <h4>Donation Details</h4>
                <p><strong>Scheduled:</strong> ${formatDateTime(donation.scheduled_date)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${donation.status}">${getStatusLabel(donation.status)}</span></p>
                <p><strong>Total Weight:</strong> ${donation.total_weight} lbs</p>
            </div>
            
            <div class="detail-section">
                <h4>Items Donated</h4>
                <ul>
                    ${donation.items.map(item => `
                        <li>${item.quantity} ${item.unit} of ${item.name}</li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="detail-section">
                <h4>Impact Summary</h4>
                <div class="impact-metrics-detailed">
                    <div class="metric">
                        <span class="metric-value">${donation.impact.meals}</span>
                        <span class="metric-label">Meals Provided</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${donation.impact.co2_reduced} kg</span>
                        <span class="metric-label">CO₂ Reduced</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${(donation.total_weight * 1300).toLocaleString()} L</span>
                        <span class="metric-label">Water Saved</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    donationDetailsModal.style.display = 'flex';
}

// Close donation details
function closeDonationDetails() {
    donationDetailsModal.style.display = 'none';
}

// Edit donation
function editDonation(id) {
    const donation = donations.find(d => d.id === id);
    if (!donation) return;
    
    // For demo purposes, we'll just show a message
    showToast('Edit functionality would open here in a full implementation', 'info');
}

// Cancel donation
async function cancelDonation(id) {
    if (!confirm('Are you sure you want to cancel this donation?')) return;
    
    try {
        // Mock cancellation - replace with actual API call
        const donationIndex = donations.findIndex(d => d.id === id);
        if (donationIndex !== -1) {
            donations[donationIndex].status = 'cancelled';
        }
        
        showToast('Donation cancelled successfully', 'success');
        await initializeDonations();
        
    } catch (error) {
        console.error('Error cancelling donation:', error);
        showToast('Error cancelling donation', 'error');
    }
}

// Filter donations
function filterDonations() {
    const searchTerm = document.getElementById('searchDonations').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const recipientFilter = document.getElementById('recipientFilter').value;
    
    let filtered = donations;
    
    if (searchTerm) {
        filtered = filtered.filter(donation => 
            donation.recipient_name.toLowerCase().includes(searchTerm) ||
            donation.items.some(item => item.name.toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(donation => donation.status === statusFilter);
    }
    
    if (recipientFilter) {
        filtered = filtered.filter(donation => donation.recipient_name === recipientFilter);
    }
    
    renderFilteredDonations(filtered);
}

// Render filtered donations
function renderFilteredDonations(filteredDonations) {
    const donationsBody = document.getElementById('donationsBody');
    
    if (filteredDonations.length === 0) {
        donationsBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No donations match your filters</p>
                    <button class="btn btn-outline" onclick="clearFilters()">
                        Clear Filters
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    donationsBody.innerHTML = filteredDonations.map(donation => `
        <tr>
            <td>#D${donation.id.toString().padStart(4, '0')}</td>
            <td>${escapeHtml(donation.recipient_name)}</td>
            <td>
                <div class="item-list">
                    ${donation.items.map(item => 
                        `<span class="item-tag">${item.quantity} ${item.unit} ${item.name}</span>`
                    ).join('')}
                </div>
            </td>
            <td>${donation.total_weight} lbs</td>
            <td>${formatDateTime(donation.scheduled_date)}</td>
            <td><span class="status-badge status-${donation.status}">${getStatusLabel(donation.status)}</span></td>
            <td>
                <div class="impact-metrics">
                    <small>${donation.impact.meals} meals</small>
                    <small>${donation.impact.co2_reduced} kg CO₂</small>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" data-id="${donation.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" data-id="${donation.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-cancel" data-id="${donation.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Clear filters
function clearFilters() {
    document.getElementById('searchDonations').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('recipientFilter').value = '';
    renderDonationsTable();
}

// Update donation stats
function updateDonationStats() {
    const totalMeals = donations.reduce((sum, donation) => sum + donation.impact.meals, 0);
    const totalWeight = donations.reduce((sum, donation) => sum + donation.total_weight, 0);
    const totalCO2 = donations.reduce((sum, donation) => sum + donation.impact.co2_reduced, 0);
    
    document.getElementById('totalMeals').textContent = totalMeals.toLocaleString();
    document.getElementById('totalWeight').textContent = totalWeight.toLocaleString() + ' lbs';
    document.getElementById('co2Reduced').textContent = totalCO2.toFixed(1) + ' kg';
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

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
}

function getStatusLabel(status) {
    const statuses = {
        'scheduled': 'Scheduled',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
            <h3>Donations Unavailable</h3>
            <p>Unable to connect to the server. Please check your connection and try again.</p>
            <button class="btn btn-primary" onclick="initializeDonations()">
                <i class="fas fa-sync-alt"></i> Retry Connection
            </button>
        </div>
    `;
}

// Make functions globally available
window.openDonationModal = openDonationModal;
window.toggleItemSelection = toggleItemSelection;
window.removeSelectedItem = removeSelectedItem;
window.clearFilters = clearFilters;
window.initializeDonations = initializeDonations;