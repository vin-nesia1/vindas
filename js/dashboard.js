// Dashboard Handler for DOMAIN FREE VIN NESIA
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is authenticated
    if (typeof window.authModule === 'undefined') {
        console.error('Authentication module not loaded');
        return;
    }

    const user = await window.authModule.getCurrentUser();
    if (!user) {
        // Redirect to home if not authenticated
        showAlert('Please login to access your dashboard', 'warning');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }

    // Initialize dashboard
    await initializeDashboard(user);
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize dashboard
async function initializeDashboard(user) {
    try {
        // Show loading state
        showLoadingState(true);
        
        // Load user applications
        const applications = await loadUserApplications(user.id);
        
        // Update statistics
        updateStatistics(applications);
        
        // Populate applications table
        populateApplicationsTable(applications);
        
        // Hide loading state
        showLoadingState(false);
        
        // Show appropriate state
        if (applications.length === 0) {
            showEmptyState(true);
        } else {
            showEmptyState(false);
        }
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Failed to load dashboard data', 'error');
        showLoadingState(false);
    }
}

// Load user applications from Supabase
async function loadUserApplications(userId) {
    try {
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase client not available');
        }

        const { data, error } = await supabase
            .from('form_data')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error loading applications:', error);
        throw error;
    }
}

// Update statistics cards
function updateStatistics(applications) {
    const totalCount = applications.length;
    const approvedCount = applications.filter(app => app.status === 'approved').length;
    const pendingCount = applications.filter(app => app.status === 'pending').length;
    const rejectedCount = applications.filter(app => app.status === 'rejected').length;

    // Update DOM elements
    updateElement('total-count', totalCount);
    updateElement('approved-count', approvedCount);
    updateElement('pending-count', pendingCount);
    updateElement('rejected-count', rejectedCount);
}

// Update DOM element
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Populate applications table
function populateApplicationsTable(applications) {
    const tbody = document.getElementById('applications-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    applications.forEach(app => {
        const row = createApplicationRow(app);
        tbody.appendChild(row);
    });
}

// Create application table row
function createApplicationRow(application) {
    const row = document.createElement('tr');
    row.className = 'custom-table hover:bg-gray-700/50 transition-colors';
    
    const statusClass = getStatusClass(application.status);
    const statusIcon = getStatusIcon(application.status);
    const formattedDate = formatDate(application.created_at);
    const truncatedLink = truncateText(application.platform_link, 30);

    row.innerHTML = `
        <td class="p-4 text-gray-300">${escapeHtml(application.name)}</td>
        <td class="p-4 text-gray-300">${escapeHtml(application.email)}</td>
        <td class="p-4 text-gray-300 capitalize">${escapeHtml(application.purpose)}</td>
        <td class="p-4">
            <a href="${escapeHtml(application.platform_link)}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-blue-400 hover:text-blue-300 transition-colors"
               title="${escapeHtml(application.platform_link)}">
                ${escapeHtml(truncatedLink)}
                <i class="fas fa-external-link-alt ml-1 text-xs"></i>
            </a>
        </td>
        <td class="p-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
                <i class="${statusIcon} mr-1"></i>
                ${capitalizeFirst(application.status)}
            </span>
        </td>
        <td class="p-4 text-gray-400 text-sm">${formattedDate}</td>
    `;

    return row;
}

// Get status CSS class
function getStatusClass(status) {
    switch (status) {
        case 'approved':
            return 'status-approved';
        case 'rejected':
            return 'status-rejected';
        case 'pending':
        default:
            return 'status-pending';
    }
}

// Get status icon
function getStatusIcon(status) {
    switch (status) {
        case 'approved':
            return 'fas fa-check-circle';
        case 'rejected':
            return 'fas fa-times-circle';
        case 'pending':
        default:
            return 'fas fa-clock';
    }
}

// Show/hide loading state
function showLoadingState(show) {
    const loadingState = document.getElementById('loading-state');
    const applicationsTable = document.querySelector('.overflow-x-auto');
    
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
    
    if (applicationsTable) {
        applicationsTable.style.display = show ? 'none' : 'block';
    }
}

// Show/hide empty state
function showEmptyState(show) {
    const emptyState = document.getElementById('empty-state');
    const applicationsTable = document.querySelector('.overflow-x-auto');
    
    if (emptyState) {
        emptyState.style.display = show ? 'block' : 'none';
    }
    
    if (applicationsTable) {
        applicationsTable.style.display = show ? 'none' : 'block';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            const user = await window.authModule.getCurrentUser();
            if (user) {
                showAlert('Refreshing data...', 'info');
                await initializeDashboard(user);
                showAlert('Data refreshed successfully', 'success');
            }
        });
    }
}

// Auto-refresh functionality
function startAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(async () => {
        const user = await window.authModule.getCurrentUser();
        if (user) {
            try {
                const applications = await loadUserApplications(user.id);
                updateStatistics(applications);
                populateApplicationsTable(applications);
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }
    }, 30000);
}

// Start auto-refresh
startAutoRefresh();

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function showAlert(message, type = 'info') {
    if (typeof window.authModule !== 'undefined' && window.authModule.showAlert) {
        window.authModule.showAlert(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}
