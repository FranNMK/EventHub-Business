/**
 * Vendors Page Script
 * Displays approved vendors from the database
 */

document.addEventListener('DOMContentLoaded', () => {
    loadVendors();
    setupEventListeners();
});

function setupEventListeners() {
    // Search with debounce
    document.getElementById('vendorSearch')?.addEventListener('input', Helpers.debounce(() => {
        loadVendors();
    }, 500));

    // Service filter
    document.getElementById('serviceFilter')?.addEventListener('change', () => {
        loadVendors();
    });
}

/**
 * Load vendors from API
 */
async function loadVendors() {
    try {
        const search = document.getElementById('vendorSearch')?.value || '';
        const serviceType = document.getElementById('serviceFilter')?.value || 'all';
        
        let endpoint = '/vendors?approved=true&limit=20';
        if (serviceType !== 'all') endpoint += `&serviceType=${serviceType}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;

        // If not authenticated, still try to fetch (public route)
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`);
        const data = await response.json();
        
        if (data.success) {
            renderVendors(data.data);
            updateStats(data.data);
        } else {
            showEmptyState('No vendors found');
        }
    } catch (error) {
        console.error('Failed to load vendors:', error);
        showEmptyState('Unable to load vendors. Please try again.');
    }
}

/**
 * Render vendors grid
 */
function renderVendors(vendors) {
    const grid = document.getElementById('vendorsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!vendors || vendors.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    grid.innerHTML = vendors.map(vendor => `
        <div class="vendor-card">
            <div class="vendor-card-header">
                <div class="vendor-logo">
                    <i class="fas fa-building"></i>
                </div>
                <div class="vendor-info">
                    <h3 class="vendor-name">${Helpers.sanitizeHTML(vendor.company_name)}</h3>
                    <span class="vendor-type">${vendor.service_type || 'General Services'}</span>
                </div>
            </div>
            <div class="vendor-card-body">
                <p class="vendor-description">${Helpers.sanitizeHTML(vendor.description || 'Providing quality services for corporate events.')}</p>
                <div class="vendor-contact">
                    ${vendor.contact_email ? `
                        <span><i class="fas fa-envelope"></i> ${vendor.contact_email}</span>
                    ` : ''}
                    ${vendor.contact_phone ? `
                        <span><i class="fas fa-phone"></i> ${vendor.contact_phone}</span>
                    ` : ''}
                    ${vendor.website ? `
                        <span><i class="fas fa-globe"></i> ${vendor.website}</span>
                    ` : ''}
                </div>
            </div>
            <div class="vendor-card-footer">
                <span class="approved-badge">
                    <i class="fas fa-check-circle"></i> Approved Vendor
                </span>
                ${vendor.contact_email ? `
                    <a href="mailto:${vendor.contact_email}" class="btn btn-outline btn-sm">
                        <i class="fas fa-paper-plane"></i> Contact
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Show empty state with message
 */
function showEmptyState(message) {
    const grid = document.getElementById('vendorsGrid');
    const emptyState = document.getElementById('emptyState');
    
    grid.innerHTML = '';
    emptyState.classList.remove('d-none');
    emptyState.querySelector('p').textContent = message;
}

/**
 * Update vendor stats
 */
function updateStats(vendors) {
    const total = vendors.length;
    const approved = vendors.filter(v => v.is_approved === 1).length;
    
    document.getElementById('totalVendors').textContent = total;
    document.getElementById('approvedVendors').textContent = approved;
    document.getElementById('totalServices').textContent = total * 2 || 0;
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('vendorSearch').value = '';
    document.getElementById('serviceFilter').value = 'all';
    loadVendors();
}

// Global functions
window.resetFilters = resetFilters;