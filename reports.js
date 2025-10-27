// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM elements
const refreshBtn = document.getElementById('refreshBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const generateReportBtn = document.getElementById('generateReportBtn');
const exportReportBtn = document.getElementById('exportReportBtn');
const printReportBtn = document.getElementById('printReportBtn');
const reportPeriod = document.getElementById('reportPeriod');
const customDateRange = document.getElementById('customDateRange');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');

// State variables
let currentReport = null;
let chartInstances = [];

// Initialize reports page
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Initializing Reports page...');
    initializeReports();
    
    // Set default dates for custom range
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    startDate.value = lastWeek.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
});

// Event listeners
refreshBtn.addEventListener('click', initializeReports);
generateReportBtn.addEventListener('click', generateReport);
exportReportBtn.addEventListener('click', exportReport);
printReportBtn.addEventListener('click', printReport);
reportPeriod.addEventListener('change', handlePeriodChange);

// Quick report cards
document.querySelectorAll('.quick-report-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const reportType = e.currentTarget.getAttribute('data-report');
        const period = e.currentTarget.getAttribute('data-period');
        
        document.getElementById('reportType').value = reportType;
        document.getElementById('reportPeriod').value = period;
        
        generateReport();
    });
});

// Template buttons
document.querySelectorAll('.template-use-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const template = e.currentTarget.getAttribute('data-template');
        useTemplate(template);
    });
});

// Initialize reports
async function initializeReports() {
    try {
        await testConnection();
        console.log('✅ Reports page ready');
    } catch (error) {
        console.error('❌ Error initializing reports:', error);
        showToast('Error connecting to server. Some features may be limited.', 'error');
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

// Handle period change
function handlePeriodChange() {
    if (reportPeriod.value === 'custom') {
        customDateRange.style.display = 'flex';
    } else {
        customDateRange.style.display = 'none';
    }
}

// Generate report
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const period = document.getElementById('reportPeriod').value;
    const includeCharts = document.getElementById('includeCharts').checked;
    
    if (!reportType || !period) {
        showToast('Please select report type and time period', 'error');
        return;
    }
    
    if (period === 'custom' && (!startDate.value || !endDate.value)) {
        showToast('Please select start and end dates for custom range', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        // Get date range
        const dateRange = getDateRange(period);
        
        // Load data and generate report
        const reportData = await loadReportData(reportType, dateRange);
        currentReport = {
            type: reportType,
            period: period,
            dateRange: dateRange,
            data: reportData,
            includeCharts: includeCharts,
            generatedAt: new Date()
        };
        
        renderReport();
        showToast(`${getReportTypeLabel(reportType)} generated successfully`, 'success');
        
        // Enable export and print buttons
        exportReportBtn.disabled = false;
        printReportBtn.disabled = false;
        
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error generating report', 'error');
    } finally {
        showLoading(false);
    }
}

// Get date range based on period
function getDateRange(period) {
    const today = new Date();
    let start, end = today;
    
    switch (period) {
        case 'last-week':
            start = new Date(today);
            start.setDate(today.getDate() - 7);
            break;
        case 'last-month':
            start = new Date(today);
            start.setDate(today.getDate() - 30);
            break;
        case 'last-quarter':
            start = new Date(today);
            start.setDate(today.getDate() - 90);
            break;
        case 'last-year':
            start = new Date(today);
            start.setDate(today.getDate() - 365);
            break;
        case 'custom':
            start = new Date(startDate.value);
            end = new Date(endDate.value);
            break;
        default:
            start = new Date(today);
            start.setDate(today.getDate() - 30);
    }
    
    return { start, end };
}

// Load report data
async function loadReportData(reportType, dateRange) {
    // Mock data - replace with actual API calls
    switch (reportType) {
        case 'inventory':
            return await loadInventoryReportData(dateRange);
        case 'waste':
            return await loadWasteReportData(dateRange);
        case 'donations':
            return await loadDonationsReportData(dateRange);
        case 'financial':
            return await loadFinancialReportData(dateRange);
        case 'environmental':
            return await loadEnvironmentalReportData(dateRange);
        case 'comprehensive':
            return await loadComprehensiveReportData(dateRange);
        default:
            return {};
    }
}

// Mock data loaders
async function loadInventoryReportData(dateRange) {
    // Mock inventory data
    return {
        summary: {
            totalItems: 145,
            totalValue: 2850,
            avgShelfLife: 4.2,
            turnoverRate: 78
        },
        categories: [
            { name: 'Fruits & Vegetables', count: 35, value: 420 },
            { name: 'Dairy', count: 28, value: 380 },
            { name: 'Meat & Poultry', count: 22, value: 650 },
            { name: 'Bakery', count: 25, value: 280 },
            { name: 'Prepared Foods', count: 18, value: 520 },
            { name: 'Beverages', count: 17, value: 600 }
        ],
        status: {
            fresh: 89,
            expiring: 32,
            expired: 24
        },
        trends: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            inventory: [120, 135, 128, 142, 138, 145],
            waste: [45, 38, 42, 35, 32, 24]
        }
    };
}

async function loadWasteReportData(dateRange) {
    return {
        summary: {
            totalWaste: 124,
            wasteReduction: 28,
            costSavings: 620,
            donationRate: 68
        },
        byCategory: [
            { category: 'Bakery', waste: 45, percentage: 36.3 },
            { category: 'Produce', waste: 32, percentage: 25.8 },
            { category: 'Dairy', waste: 22, percentage: 17.7 },
            { category: 'Prepared', waste: 15, percentage: 12.1 },
            { category: 'Other', waste: 10, percentage: 8.1 }
        ],
        trends: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            waste: [45, 38, 42, 35, 32, 24],
            donations: [15, 18, 22, 25, 28, 32]
        },
        causes: [
            { cause: 'Overordering', percentage: 42 },
            { cause: 'Spoilage', percentage: 28 },
            { cause: 'Preparation Waste', percentage: 18 },
            { cause: 'Other', percentage: 12 }
        ]
    };
}

async function loadDonationsReportData(dateRange) {
    return {
        summary: {
            totalDonations: 24,
            totalMeals: 1200,
            totalWeight: 185,
            co2Reduced: 42.5
        },
        byRecipient: [
            { recipient: 'City Food Bank', donations: 8, meals: 400 },
            { recipient: 'Community Shelter', donations: 6, meals: 300 },
            { recipient: 'Youth Center', donations: 5, meals: 250 },
            { recipient: 'Senior Center', donations: 3, meals: 150 },
            { recipient: 'Other', donations: 2, meals: 100 }
        ],
        impact: {
            meals: 1200,
            co2: 42.5,
            water: 240500,
            economic: 3100
        },
        trends: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            donations: [3, 4, 3, 5, 4, 5],
            meals: [150, 200, 180, 250, 220, 200]
        }
    };
}

async function loadFinancialReportData(dateRange) {
    return {
        summary: {
            costSavings: 2850,
            wasteReduction: 1240,
            donationValue: 3100,
            roi: 218
        },
        breakdown: {
            inventory: 2850,
            waste: -1240,
            donations: 3100,
            labor: -850,
            net: 3860
        },
        trends: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            savings: [2200, 2350, 2450, 2650, 2750, 2850],
            waste: [1800, 1650, 1520, 1420, 1320, 1240]
        }
    };
}

async function loadEnvironmentalReportData(dateRange) {
    return {
        summary: {
            co2Reduced: 2.8,
            waterSaved: 161200,
            landSaved: 347,
            wasteDiverted: 124
        },
        metrics: {
            co2: { value: 2.8, unit: 'tons', equivalent: '6,000 miles driven' },
            water: { value: 161.2, unit: 'thousand liters', equivalent: '200 households daily' },
            land: { value: 347, unit: 'square meters', equivalent: '0.7 football fields' },
            waste: { value: 124, unit: 'pounds', equivalent: '50 garbage bags' }
        },
        comparison: {
            before: { co2: 4.2, water: 240, land: 520, waste: 185 },
            after: { co2: 2.8, water: 161, land: 347, waste: 124 }
        }
    };
}

async function loadComprehensiveReportData(dateRange) {
    // Combine data from all report types
    const [
        inventory,
        waste,
        donations,
        financial,
        environmental
    ] = await Promise.all([
        loadInventoryReportData(dateRange),
        loadWasteReportData(dateRange),
        loadDonationsReportData(dateRange),
        loadFinancialReportData(dateRange),
        loadEnvironmentalReportData(dateRange)
    ]);
    
    return {
        inventory,
        waste,
        donations,
        financial,
        environmental,
        executiveSummary: {
            performance: 'Excellent',
            wasteReduction: 28,
            costSavings: 2850,
            communityImpact: 1200
        }
    };
}

// Render report
function renderReport() {
    const preview = document.getElementById('reportPreview');
    const section = document.getElementById('reportPreviewSection');
    
    // Clear previous charts
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
    
    let reportHTML = '';
    
    switch (currentReport.type) {
        case 'inventory':
            reportHTML = renderInventoryReport();
            break;
        case 'waste':
            reportHTML = renderWasteReport();
            break;
        case 'donations':
            reportHTML = renderDonationsReport();
            break;
        case 'financial':
            reportHTML = renderFinancialReport();
            break;
        case 'environmental':
            reportHTML = renderEnvironmentalReport();
            break;
        case 'comprehensive':
            reportHTML = renderComprehensiveReport();
            break;
    }
    
    preview.innerHTML = reportHTML;
    section.style.display = 'block';
    
    // Initialize charts if enabled
    if (currentReport.includeCharts) {
        initializeReportCharts();
    }
    
    // Scroll to report
    section.scrollIntoView({ behavior: 'smooth' });
}

// Render inventory report
function renderInventoryReport() {
    const data = currentReport.data;
    return `
        <div class="report-header">
            <h1 class="report-title">Inventory Analysis Report</h1>
            <div class="report-period">${formatDateRange(currentReport.dateRange)}</div>
            <div class="report-meta">Generated on ${currentReport.generatedAt.toLocaleDateString()}</div>
        </div>
        
        <div class="report-section">
            <h3>Executive Summary</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${data.summary.totalItems}</div>
                    <div class="metric-label">Total Items</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">$${data.summary.totalValue}</div>
                    <div class="metric-label">Inventory Value</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.summary.avgShelfLife} days</div>
                    <div class="metric-label">Avg Shelf Life</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.summary.turnoverRate}%</div>
                    <div class="metric-label">Turnover Rate</div>
                </div>
            </div>
        </div>
        
        ${currentReport.includeCharts ? `
        <div class="report-section">
            <h3>Inventory Trends</h3>
            <div class="report-chart">
                <canvas id="inventoryTrendChart"></canvas>
            </div>
        </div>
        
        <div class="report-section">
            <div class="two-column-layout">
                <div class="column">
                    <h4>Inventory by Category</h4>
                    <div class="report-chart">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
                <div class="column">
                    <h4>Inventory Status</h4>
                    <div class="report-chart">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="report-section">
            <h3>Category Breakdown</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Item Count</th>
                        <th>Value</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.categories.map(cat => `
                        <tr>
                            <td>${cat.name}</td>
                            <td>${cat.count}</td>
                            <td>$${cat.value}</td>
                            <td>${Math.round((cat.count / data.summary.totalItems) * 100)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="report-footer">
            <p>FoodShare Inventory Report • Confidential</p>
        </div>
    `;
}

// Render waste report
function renderWasteReport() {
    const data = currentReport.data;
    return `
        <div class="report-header">
            <h1 class="report-title">Food Waste Analysis Report</h1>
            <div class="report-period">${formatDateRange(currentReport.dateRange)}</div>
            <div class="report-meta">Generated on ${currentReport.generatedAt.toLocaleDateString()}</div>
        </div>
        
        <div class="report-section">
            <h3>Waste Reduction Impact</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${data.summary.totalWaste} lbs</div>
                    <div class="metric-label">Total Waste</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.summary.wasteReduction}%</div>
                    <div class="metric-label">Reduction</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">$${data.summary.costSavings}</div>
                    <div class="metric-label">Cost Savings</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.summary.donationRate}%</div>
                    <div class="metric-label">Donation Rate</div>
                </div>
            </div>
        </div>
        
        ${currentReport.includeCharts ? `
        <div class="report-section">
            <h3>Waste & Donation Trends</h3>
            <div class="report-chart">
                <canvas id="wasteTrendChart"></canvas>
            </div>
        </div>
        
        <div class="report-section">
            <div class="two-column-layout">
                <div class="column">
                    <h4>Waste by Category</h4>
                    <div class="report-chart">
                        <canvas id="wasteCategoryChart"></canvas>
                    </div>
                </div>
                <div class="column">
                    <h4>Waste Causes</h4>
                    <div class="report-chart">
                        <canvas id="wasteCauseChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="report-section">
            <h3>Detailed Waste Analysis</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Waste (lbs)</th>
                        <th>Percentage</th>
                        <th>Trend</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.byCategory.map(cat => `
                        <tr>
                            <td>${cat.category}</td>
                            <td>${cat.waste}</td>
                            <td>${cat.percentage}%</td>
                            <td>
                                <span class="stat-trend ${cat.waste > 30 ? 'negative' : 'positive'}">
                                    <i class="fas fa-arrow-${cat.waste > 30 ? 'up' : 'down'}"></i>
                                    ${cat.waste > 30 ? 'High' : 'Low'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="report-footer">
            <p>FoodShare Waste Analysis Report • Confidential</p>
        </div>
    `;
}

// Initialize report charts
function initializeReportCharts() {
    const data = currentReport.data;
    
    switch (currentReport.type) {
        case 'inventory':
            initInventoryCharts(data);
            break;
        case 'waste':
            initWasteCharts(data);
            break;
        case 'donations':
            initDonationCharts(data);
            break;
        // Add other chart initializations as needed
    }
}

// Initialize inventory charts
function initInventoryCharts(data) {
    // Inventory Trend Chart
    const trendCtx = document.getElementById('inventoryTrendChart').getContext('2d');
    const trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: data.trends.labels,
            datasets: [
                {
                    label: 'Inventory Level',
                    data: data.trends.inventory,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Food Waste',
                    data: data.trends.waste,
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Inventory & Waste Trends'
                }
            }
        }
    });
    chartInstances.push(trendChart);
    
    // Category Distribution Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    const categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: data.categories.map(c => c.name),
            datasets: [{
                label: 'Item Count',
                data: data.categories.map(c => c.count),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    chartInstances.push(categoryChart);
    
    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fresh', 'Expiring Soon', 'Expired'],
            datasets: [{
                data: [data.status.fresh, data.status.expiring, data.status.expired],
                backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    chartInstances.push(statusChart);
}

// Initialize waste charts
function initWasteCharts(data) {
    // Waste Trend Chart
    const trendCtx = document.getElementById('wasteTrendChart').getContext('2d');
    const trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: data.trends.labels,
            datasets: [
                {
                    label: 'Food Waste (lbs)',
                    data: data.trends.waste,
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Food Donated (lbs)',
                    data: data.trends.donations,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    chartInstances.push(trendChart);
    
    // Waste by Category Chart
    const categoryCtx = document.getElementById('wasteCategoryChart').getContext('2d');
    const categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: data.byCategory.map(c => c.category),
            datasets: [{
                label: 'Waste (lbs)',
                data: data.byCategory.map(c => c.waste),
                backgroundColor: '#FF9800'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    chartInstances.push(categoryChart);
    
    // Waste Causes Chart
    const causeCtx = document.getElementById('wasteCauseChart').getContext('2d');
    const causeChart = new Chart(causeCtx, {
        type: 'pie',
        data: {
            labels: data.causes.map(c => c.cause),
            datasets: [{
                data: data.causes.map(c => c.percentage),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    chartInstances.push(causeChart);
}

// Export report as PDF
function exportReport() {
    showToast('Export functionality would generate a PDF in a full implementation', 'info');
    // In a real implementation, this would use a library like jsPDF
    // to generate and download a PDF version of the report
}

// Print report
function printReport() {
    window.print();
}

// Use template
function useTemplate(template) {
    showToast(`"${template}" template selected. Customize report parameters and generate.`, 'info');
    // In a full implementation, this would pre-fill the form with template-specific settings
}

// Utility Functions
function getReportTypeLabel(type) {
    const types = {
        'inventory': 'Inventory Analysis',
        'waste': 'Food Waste',
        'donations': 'Donation Impact',
        'financial': 'Financial Impact',
        'environmental': 'Environmental Impact',
        'comprehensive': 'Comprehensive'
    };
    return types[type] || type;
}

function formatDateRange(dateRange) {
    return `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
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

// Add these placeholder render functions for other report types
function renderDonationsReport() {
    return `<div class="report-header"><h1>Donations Report</h1><p>Implementation details would go here</p></div>`;
}

function renderFinancialReport() {
    return `<div class="report-header"><h1>Financial Report</h1><p>Implementation details would go here</p></div>`;
}

function renderEnvironmentalReport() {
    return `<div class="report-header"><h1>Environmental Report</h1><p>Implementation details would go here</p></div>`;
}

function renderComprehensiveReport() {
    return `<div class="report-header"><h1>Comprehensive Report</h1><p>Implementation details would go here</p></div>`;
}

// Add these placeholder chart initialization functions
function initDonationCharts(data) {
    // Implementation for donation charts
}

// Make functions globally available
window.generateReport = generateReport;
window.exportReport = exportReport;
window.printReport = printReport;