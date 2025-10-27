// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const addRecipientBtn = document.getElementById('addRecipientBtn');
const importRecipientsBtn = document.getElementById('importRecipientsBtn');
const exportRecipientsBtn = document.getElementById('exportRecipientsBtn');
const recipientModal = document.getElementById('recipientModal');
const cancelRecipientBtn = document.getElementById('cancelRecipientBtn');
const saveRecipientBtn = document.getElementById('saveRecipientBtn');
const recipientForm = document.getElementById('recipientForm');
const recipientDetailsModal = document.getElementById('recipientDetailsModal');
const closeRecipientDetailsBtn = document.getElementById('closeRecipientDetailsBtn');
const editRecipientBtn = document.getElementById('editRecipientBtn');

// State variables
let recipients = [];
let currentEditingId = null;

// Initialize recipients page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Recipients page...');
    initializeRecipients();
});

// Event listeners
refreshBtn.addEventListener('click', initializeRecipients);
addRecipientBtn.addEventListener('click', openRecipientModal);
importRecipientsBtn.addEventListener('click', handleImportRecipients);
exportRecipientsBtn.addEventListener('click', handleExportRecipients);
cancelRecipientBtn.addEventListener('click', closeRecipientModal);
saveRecipientBtn.addEventListener('click', saveRecipient);
closeRecipientDetailsBtn.addEventListener('click', closeRecipientDetails);
editRecipientBtn.addEventListener('click', editCurrentRecipient);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === recipientModal) closeRecipientModal();
    if (e.target === recipientDetailsModal) closeRecipientDetails();
});

// Search and filter functionality
document.getElementById('searchRecipients').addEventListener('input', debounce(filterRecipients, 300));
document.getElementById('typeFilter').addEventListener('change', filterRecipients);
document.getElementById('statusFilter').addEventListener('change', filterRecipients);

// Initialize recipients
async function initializeRecipients() {
    try {
        showLoading(true);
        console.log('📋 Loading recipients data...');
        
        await testConnection();
        await loadRecipients();
        updateRecipientStats();
        
        console.log('✅ Recipients initialized successfully');
        showLoading(false);
    } catch (error) {
        console.error('❌ Error initializing recipients:', error);
        showToast('Error loading recipients data. Make sure the backend server is running.', 'error');
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

// Load recipients data
async function loadRecipients() {
    try {
        // Mock data 
        recipients = [
            {
                id: 1,
                name: 'City Food Bank',
                type: 'food-bank',
                contact_person: 'Sarah Johnson',
                email: 'sarah@cityfoodbank.org',
                phone: '(+27) 78-123-4567',
                address: '123 Main Street',
                city: 'Springs',
                province: 'Gauteng',
                zip_code: '1575',
                capacity: 500,
                notes: 'Accepts all food types. Prefers deliveries before 3 PM.',
                status: 'active',
                created_at: '2025-10-27',
                total_donations: 24,
                total_meals: 1200,
                rating: 4.8
            },
            {
                id: 2,
                name: 'Community Shelter',
                type: 'shelter',
                contact_person: 'Mike Thompson',
                email: 'mike@communityshelter.org',
                phone: '(+27) 67-234-5678',
                address: '456 Oak Avenue',
                city: 'Centurion',
                province: 'Gauteng',
                zip_code: '0157',
                capacity: 200,
                notes: 'Focus on ready-to-eat meals. Kitchen available for preparation.',
                status: 'active',
                created_at: '2025-10-28',
                total_donations: 18,
                total_meals: 900,
                rating: 4.9
            },
            {
                id: 3,
                name: 'Youth Center',
                type: 'community-center',
                contact_person: 'Lisa Chen',
                email: 'lisa@youthcenter.org',
                phone: '(+27) 11-345-6789',
                address: '789 Pine Road',
                city: 'Benoni',
                province: 'Gauteng',
                zip_code: '1501',
                capacity: 150,
                notes: 'After-school program. Prefers healthy snacks and fruits.',
                status: 'active',
                created_at: '2025-10-27',
                total_donations: 12,
                total_meals: 600,
                rating: 4.7
            },
            {
                id: 4,
                name: 'Senior Center',
                type: 'community-center',
                contact_person: 'Robert Davis',
                email: 'robert@seniorcenter.org',
                phone: '(+27) 67-456-7890',
                address: '321 Elm Street',
                city: 'Bloemfontein',
                province: 'Free State',
                zip_code: '1000',
                capacity: 100,
                notes: 'Soft foods preferred. Dietary restrictions common.',
                status: 'active',
                created_at: '2025-10-27',
                total_donations: 8,
                total_meals: 400,
                rating: 4.6
            },
            {
                id: 5,
                name: 'Homeless Outreach',
                type: 'non-profit',
                contact_person: 'Maria Garcia',
                email: 'maria@homelessoutreach.org',
                phone: '(+27) 78-567-8901',
                address: '654 Maple Drive',
                city: 'Brakpan',
                province: 'Gauteng',
                zip_code: '1550',
                capacity: 300,
                notes: 'Mobile distribution. Non-perishable items preferred.',
                status: 'pending',
                created_at: '2025-10-27',
                total_donations: 0,
                total_meals: 0,
                rating: 0
            }
        ];
        
        renderRecipientsGrid();
    } catch (error) {
        throw new Error('Failed to load recipients');
    }
}

// Render recipients grid
function renderRecipientsGrid() {
    const grid = document.getElementById('recipientsGrid');
    
    if (recipients.length === 0) {
        grid.innerHTML = `
            <div class="empty-dashboard">
                <i class="fas fa-hands-helping"></i>
                <h3>No Recipient Organizations</h3>
                <p>Get started by adding your first recipient organization</p>
                <button class="btn btn-primary" onclick="openRecipientModal()">
                    <i class="fas fa-plus"></i> Add First Recipient
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = recipients.map(recipient => `
        <div class="recipient-card" onclick="viewRecipientDetails(${recipient.id})">
            <div class="recipient-header">
                <div>
                    <div class="recipient-name">${escapeHtml(recipient.name)}</div>
                    <span class="recipient-type">${getTypeLabel(recipient.type)}</span>
                </div>
                <span class="status-badge status-${recipient.status}">${getStatusLabel(recipient.status)}</span>
            </div>
            
            <div class="recipient-contact">
                <div class="contact-info">
                    <i class="fas fa-user"></i>
                    <span>${escapeHtml(recipient.contact_person)}</span>
                </div>
                <div class="contact-info">
                    <i class="fas fa-phone"></i>
                    <span>${recipient.phone}</span>
                </div>
                <div class="contact-info">
                    <i class="fas fa-envelope"></i>
                    <span>${recipient.email}</span>
                </div>
                <div class="contact-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${recipient.city}, ${recipient.province}</span>
                </div>
            </div>
            
            <div class="recipient-stats">
                <div class="stat-small">
                    <div class="stat-value">${recipient.total_donations}</div>
                    <div class="stat-label-small">Donations</div>
                </div>
                <div class="stat-small">
                    <div class="stat-value">${recipient.total_meals}</div>
                    <div class="stat-label-small">Meals</div>
                </div>
                <div class="stat-small">
                    <div class="stat-value">${recipient.capacity}</div>
                    <div class="stat-label-small">Daily Capacity</div>
                </div>
                <div class="stat-small">
                    <div class="stat-value">${recipient.rating || 'N/A'}</div>
                    <div class="stat-label-small">Rating</div>
                </div>
            </div>
            
            <div class="recipient-actions-card">
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); scheduleDonation(${recipient.id})">
                    <i class="fas fa-truck"></i> Donate
                </button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); editRecipient(${recipient.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); toggleRecipientStatus(${recipient.id})">
                    <i class="fas fa-power-off"></i> ${recipient.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

// Open recipient modal
function openRecipientModal() {
    recipientModal.style.display = 'flex';
    document.getElementById('recipientModalTitle').textContent = 'Add Recipient Organization';
    currentEditingId = null;
    recipientForm.reset();
    document.getElementById('recipientActive').checked = true;
}

// Close recipient modal
function closeRecipientModal() {
    recipientModal.style.display = 'none';
    recipientForm.reset();
    currentEditingId = null;
}

// Save recipient
async function saveRecipient() {
    const formData = {
        name: document.getElementById('recipientName').value.trim(),
        type: document.getElementById('recipientType').value,
        contact_person: document.getElementById('recipientContact').value.trim(),
        email: document.getElementById('recipientEmail').value.trim(),
        phone: document.getElementById('recipientPhone').value.trim(),
        address: document.getElementById('recipientAddress').value.trim(),
        city: document.getElementById('recipientCity').value.trim(),
        province: document.getElementById('recipientProvince').value.trim(),
        zip_code: document.getElementById('recipientZip').value.trim(),
        capacity: parseInt(document.getElementById('recipientCapacity').value) || 0,
        notes: document.getElementById('recipientNotes').value.trim(),
        status: document.getElementById('recipientActive').checked ? 'active' : 'inactive'
    };
    
    // Validation
    if (!formData.name || !formData.type || !formData.contact_person || !formData.email || !formData.phone) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        if (currentEditingId) {
            // Update existing recipient
            const recipientIndex = recipients.findIndex(r => r.id === currentEditingId);
            if (recipientIndex !== -1) {
                recipients[recipientIndex] = { ...recipients[recipientIndex], ...formData };
            }
            showToast('Recipient updated successfully!', 'success');
        } else {
            // Add new recipient
            const newRecipient = {
                id: Math.max(...recipients.map(r => r.id)) + 1,
                ...formData,
                total_donations: 0,
                total_meals: 0,
                rating: 0,
                created_at: new Date().toISOString().split('T')[0]
            };
            recipients.push(newRecipient);
            showToast('Recipient added successfully!', 'success');
        }
        
        closeRecipientModal();
        await initializeRecipients();
        
    } catch (error) {
        console.error('Error saving recipient:', error);
        showToast('Error saving recipient', 'error');
    }
}

// View recipient details
function viewRecipientDetails(id) {
    const recipient = recipients.find(r => r.id === id);
    if (!recipient) return;
    
    currentEditingId = id;
    
    const content = document.getElementById('recipientDetailsContent');
    content.innerHTML = `
        <div class="recipient-details">
            <div class="detail-section">
                <h4>Organization Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Name:</strong> ${escapeHtml(recipient.name)}
                    </div>
                    <div class="detail-item">
                        <strong>Type:</strong> ${getTypeLabel(recipient.type)}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> <span class="status-badge status-${recipient.status}">${getStatusLabel(recipient.status)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Daily Capacity:</strong> ${recipient.capacity} meals
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Contact Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Contact Person:</strong> ${escapeHtml(recipient.contact_person)}
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong> ${recipient.email}
                    </div>
                    <div class="detail-item">
                        <strong>Phone:</strong> ${recipient.phone}
                    </div>
                    <div class="detail-item">
                        <strong>Address:</strong> ${recipient.address}, ${recipient.city}, ${recipient.province} ${recipient.zip_code}
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Partnership Statistics</h4>
                <div class="stats-grid-mini">
                    <div class="stat-mini">
                        <div class="stat-value-mini">${recipient.total_donations}</div>
                        <div class="stat-label-mini">Total Donations</div>
                    </div>
                    <div class="stat-mini">
                        <div class="stat-value-mini">${recipient.total_meals}</div>
                        <div class="stat-label-mini">Meals Provided</div>
                    </div>
                    <div class="stat-mini">
                        <div class="stat-value-mini">${recipient.rating || 'N/A'}</div>
                        <div class="stat-label-mini">Partner Rating</div>
                    </div>
                    <div class="stat-mini">
                        <div class="stat-value-mini">${Math.round(recipient.total_meals / recipient.capacity * 100) || 0}%</div>
                        <div class="stat-label-mini">Capacity Usage</div>
                    </div>
                </div>
            </div>
            
            ${recipient.notes ? `
            <div class="detail-section">
                <h4>Notes & Requirements</h4>
                <p>${escapeHtml(recipient.notes)}</p>
            </div>
            ` : ''}
            
            <div class="detail-section">
                <h4>Partnership History</h4>
                <p>Partner since ${formatDate(recipient.created_at)}</p>
            </div>
        </div>
    `;
    
    document.getElementById('recipientDetailsTitle').textContent = recipient.name;
    recipientDetailsModal.style.display = 'flex';
}

// Close recipient details
function closeRecipientDetails() {
    recipientDetailsModal.style.display = 'none';
    currentEditingId = null;
}

// Edit recipient
function editRecipient(id) {
    const recipient = recipients.find(r => r.id === id);
    if (!recipient) return;
    
    currentEditingId = id;
    
    // Populate form with recipient data
    document.getElementById('recipientModalTitle').textContent = 'Edit Recipient';
    document.getElementById('recipientName').value = recipient.name;
    document.getElementById('recipientType').value = recipient.type;
    document.getElementById('recipientContact').value = recipient.contact_person;
    document.getElementById('recipientEmail').value = recipient.email;
    document.getElementById('recipientPhone').value = recipient.phone;
    document.getElementById('recipientAddress').value = recipient.address;
    document.getElementById('recipientCity').value = recipient.city;
    document.getElementById('recipientProvince').value = recipient.province;
    document.getElementById('recipientZip').value = recipient.zip_code;
    document.getElementById('recipientCapacity').value = recipient.capacity;
    document.getElementById('recipientNotes').value = recipient.notes || '';
    document.getElementById('recipientActive').checked = recipient.status === 'active';
    
    recipientModal.style.display = 'flex';
}

// Edit current recipient (from details modal)
function editCurrentRecipient() {
    if (currentEditingId) {
        closeRecipientDetails();
        editRecipient(currentEditingId);
    }
}

// Schedule donation to recipient
function scheduleDonation(recipientId) {
    // Redirect to donations page with recipient pre-selected
    window.location.href = `donations.html?recipient=${recipientId}`;
}

// Toggle recipient status
async function toggleRecipientStatus(id) {
    const recipient = recipients.find(r => r.id === id);
    if (!recipient) return;
    
    const newStatus = recipient.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this recipient?`)) return;
    
    try {
        // Mock API call - replace with actual implementation
        recipient.status = newStatus;
        
        showToast(`Recipient ${action}d successfully`, 'success');
        await initializeRecipients();
        
    } catch (error) {
        console.error('Error toggling recipient status:', error);
        showToast('Error updating recipient status', 'error');
    }
}

// Handle import recipients
function handleImportRecipients() {
    showToast('Import functionality would open here in a full implementation', 'info');
}

// Handle export recipients
function handleExportRecipients() {
    // Create CSV content
    const headers = ['Name', 'Type', 'Contact Person', 'Email', 'Phone', 'Address', 'City', 'Province', 'ZIP', 'Capacity', 'Status'];
    const csvContent = [
        headers.join(','),
        ...recipients.map(recipient => [
            `"${recipient.name}"`,
            `"${recipient.type}"`,
            `"${recipient.contact_person}"`,
            `"${recipient.email}"`,
            `"${recipient.phone}"`,
            `"${recipient.address}"`,
            `"${recipient.city}"`,
            `"${recipient.province}"`,
            `"${recipient.zip_code}"`,
            recipient.capacity,
            `"${recipient.status}"`
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodshare-recipients-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Recipients exported successfully', 'success');
}

// Filter recipients
function filterRecipients() {
    const searchTerm = document.getElementById('searchRecipients').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = recipients;
    
    if (searchTerm) {
        filtered = filtered.filter(recipient => 
            recipient.name.toLowerCase().includes(searchTerm) ||
            recipient.contact_person.toLowerCase().includes(searchTerm) ||
            recipient.email.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilter) {
        filtered = filtered.filter(recipient => recipient.type === typeFilter);
    }
    
    if (statusFilter) {
        filtered = filtered.filter(recipient => recipient.status === statusFilter);
    }
    
    renderFilteredRecipients(filtered);
}

// Render filtered recipients
function renderFilteredRecipients(filteredRecipients) {
    const grid = document.getElementById('recipientsGrid');
    
    if (filteredRecipients.length === 0) {
        grid.innerHTML = `
            <div class="empty-dashboard">
                <i class="fas fa-search"></i>
                <h3>No recipients match your filters</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button class="btn btn-outline" onclick="clearFilters()">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredRecipients.map(recipient => `
        <div class="recipient-card" onclick="viewRecipientDetails(${recipient.id})">
            <div class="recipient-header">
                <div>
                    <div class="recipient-name">${escapeHtml(recipient.name)}</div>
                    <span class="recipient-type">${getTypeLabel(recipient.type)}</span>
                </div>
                <span class="status-badge status-${recipient.status}">${getStatusLabel(recipient.status)}</span>
            </div>
            
            <div class="recipient-contact">
                <div class="contact-info">
                    <i class="fas fa-user"></i>
                    <span>${escapeHtml(recipient.contact_person)}</span>
                </div>
                <div class="contact-info">
                    <i class="fas fa-phone"></i>
                    <span>${recipient.phone}</span>
                </div>
                <div class="contact-info">
                    <i class="fas fa-envelope"></i>
                    <span>${recipient.email}</span>
                </div>
                <div class="contact-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${recipient.city}, ${recipient.province}</span>
                </div>
            </div>
            
            <div class="recipient-stats">
                <div class="stat-small">
                    <div class="stat-value">${recipient.total_donations}</div>
                    <div class="stat-label-small">Donations</div>
                </div>
                <div class="stat-small">
                    <div class="stat-value">${recipient.total_meals}</div>
                    <div class="stat-label-small">Meals</div>
                </div>
                <div class="stat-small">
                    <div class="stat-value">${recipient.capacity}</div>
                    <div class="stat-label-small">Daily Capacity</div>
                </div>
                <div class="stat-small">
                    <div class="stat-value">${recipient.rating || 'N/A'}</div>
                    <div class="stat-label-small">Rating</div>
                </div>
            </div>
            
            <div class="recipient-actions-card">
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); scheduleDonation(${recipient.id})">
                    <i class="fas fa-truck"></i> Donate
                </button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); editRecipient(${recipient.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); toggleRecipientStatus(${recipient.id})">
                    <i class="fas fa-power-off"></i> ${recipient.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

// Clear filters
function clearFilters() {
    document.getElementById('searchRecipients').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    renderRecipientsGrid();
}

// Update recipient stats
function updateRecipientStats() {
    const totalRecipients = recipients.length;
    const activeRecipients = recipients.filter(r => r.status === 'active').length;
    const totalMeals = recipients.reduce((sum, recipient) => sum + recipient.total_meals, 0);
    const avgRating = recipients.filter(r => r.rating > 0).reduce((sum, recipient) => sum + recipient.rating, 0) / 
                     recipients.filter(r => r.rating > 0).length || 0;
    
    document.getElementById('totalRecipients').textContent = totalRecipients;
    document.getElementById('totalPartnershipMeals').textContent = totalMeals.toLocaleString();
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
}

// Utility Functions
function getTypeLabel(type) {
    const types = {
        'shelter': 'Shelter',
        'food-bank': 'Food Bank',
        'community-center': 'Community Center',
        'school': 'School',
        'non-profit': 'Non-Profit',
        'other': 'Other'
    };
    return types[type] || type;
}

function getStatusLabel(status) {
    const statuses = {
        'active': 'Active',
        'inactive': 'Inactive',
        'pending': 'Pending'
    };
    return statuses[status] || status;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
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
            <h3>Recipients Unavailable</h3>
            <p>Unable to connect to the server. Please check your connection and try again.</p>
            <button class="btn btn-primary" onclick="initializeRecipients()">
                <i class="fas fa-sync-alt"></i> Retry Connection
            </button>
        </div>
    `;
}

// Make functions globally available
window.openRecipientModal = openRecipientModal;
window.viewRecipientDetails = viewRecipientDetails;
window.editRecipient = editRecipient;
window.scheduleDonation = scheduleDonation;
window.toggleRecipientStatus = toggleRecipientStatus;
window.clearFilters = clearFilters;
window.initializeRecipients = initializeRecipients;