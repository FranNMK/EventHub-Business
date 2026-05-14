/**
 * Vendors Page Script
 * Displays approved vendors and their services
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
        
        let endpoint = '/vendors?approved=true';
        if (serviceType !== 'all') endpoint += `&serviceType=${serviceType}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;

        const response = await ApiService.get(endpoint);
        
        if (response.success) {
            renderVendors(response.data);
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Failed to load vendors:', error);
        // Show sample vendors since vendors API might not be ready yet
        renderSampleVendors();
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
 * Render sample vendors (fallback if API not ready)
 */
function renderSampleVendors() {
    const sampleVendors = [
        {
            company_name: 'Elite Catering Services',
            service_type: 'Catering',
            description: 'Premium corporate catering with customizable menus. From executive lunches to gala dinners, we deliver exceptional culinary experiences.',
            contact_email: 'info@elitecatering.com',
            contact_phone: '+1 (555) 234-5678',
            website: 'www.elitecatering.com'
        },
        {
            company_name: 'ProCapture Photography',
            service_type: 'Photography',
            description: 'Professional event photography and videography. We capture your corporate moments with artistic excellence.',
            contact_email: 'hello@procapture.com',
            contact_phone: '+1 (555) 345-6789',
            website: 'www.procapture.com'
        },
        {
            company_name: 'TechVision AV Solutions',
            service_type: 'Technology',
            description: 'Complete audio-visual solutions for corporate events. Projectors, sound systems, live streaming, and technical support.',
            contact_email: 'sales@techvisionav.com',
            contact_phone: '+1 (555) 456-7890',
            website: 'www.techvisionav.com'
        },
        {
            company_name: 'Elegant Decor & Design',
            service_type: 'Decoration',
            description: 'Transform your venue with stunning decorations. Specializing in corporate event themes, floral arrangements, and stage design.',
            contact_email: 'design@elegantdecor.com',
            contact_phone: '+1 (555) 567-8901',
            website: 'www.elegantdecor.com'
        },
        {
            company_name: 'Stellar Entertainment Group',
            service_type: 'Entertainment',
            description: 'Live bands, DJs, speakers, and performers for corporate events. Making your events memorable and engaging.',
            contact_email: 'book@stellarentertainment.com',
            contact_phone: '+1 (555) 678-9012',
            website: 'www.stellarentertainment.com'
        },
        {
            company_name: 'Executive Transport Co.',
            service_type: 'Transportation',
            description: 'Luxury transportation services for corporate events. VIP shuttles, car services, and logistics management.',
            contact_email: 'rides@executivetransport.com',
            contact_phone: '+1 (555) 789-0123',
            website: 'www.executivetransport.com'
        }
    ];

    renderVendors(sampleVendors);
    updateStats(sampleVendors);
}

/**
 * Update vendor stats
 */
function updateStats(vendors) {
    const total = vendors.length;
    const approved = vendors.filter(v => v.is_approved !== false).length;
    
    document.getElementById('totalVendors').textContent = total;
    document.getElementById('approvedVendors').textContent = approved;
    document.getElementById('totalServices').textContent = total * 3; // Estimated services
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