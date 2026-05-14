/**
 * Dashboard Page Script
 * Full role-based implementation
 */

let currentUser = null;
let currentEvents = [];
let currentRegistrations = [];
let currentVendors = [];
let currentServices = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    if (!ApiService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = ApiService.getCurrentUser();
    initDashboard();
    setupEventListeners();
    loadDashboardData();
});

function initDashboard() {
    document.getElementById('userName').textContent = currentUser.name || 'User';
    document.getElementById('sidebarUserName').textContent = currentUser.name || 'User';
    document.getElementById('sidebarUserRole').textContent = currentUser.role || 'user';

    const avatar = document.getElementById('userAvatar');
    if (avatar && currentUser.name) {
        avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }

    const headerActions = document.getElementById('headerActions');

    // Configure based on role
    if (currentUser.role === 'admin') {
        document.getElementById('sidebarEventsMenu').style.display = 'block';
        document.getElementById('sidebarRegistrationsMenu').style.display = 'block';
        document.getElementById('sidebarVendorsMenu').style.display = 'block';
        document.getElementById('sidebarServicesMenu').style.display = 'none';
        document.getElementById('sidebarCompanyMenu').style.display = 'none';
        document.getElementById('sidebarProfileMenu').style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Manage events, vendors, and registrations';

        headerActions.innerHTML = `
            <button class="btn btn-primary" onclick="openEventModal()">
                <i class="fas fa-plus"></i> Create Event
            </button>
        `;

    } else if (currentUser.role === 'vendor') {
        document.getElementById('sidebarEventsMenu').style.display = 'block';
        document.getElementById('sidebarRegistrationsMenu').style.display = 'block';
        document.getElementById('sidebarVendorsMenu').style.display = 'none';
        document.getElementById('sidebarServicesMenu').style.display = 'block';
        document.getElementById('sidebarCompanyMenu').style.display = 'block';
        document.getElementById('sidebarProfileMenu').style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Manage your services and company profile';

        headerActions.innerHTML = `
            <button class="btn btn-primary" onclick="openServiceModal()">
                <i class="fas fa-plus"></i> Add Service
            </button>
        `;

        // Load vendor profile on init
        loadVendorProfile();

    } else {
        // Employee
        document.getElementById('sidebarEventsMenu').style.display = 'block';
        document.getElementById('sidebarRegistrationsMenu').style.display = 'block';
        document.getElementById('sidebarVendorsMenu').style.display = 'none';
        document.getElementById('sidebarServicesMenu').style.display = 'none';
        document.getElementById('sidebarCompanyMenu').style.display = 'none';
        document.getElementById('sidebarProfileMenu').style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Browse events and manage your registrations';

        headerActions.innerHTML = `
            <button class="btn btn-primary" onclick="switchTab('events')">
                <i class="fas fa-search"></i> Browse Events
            </button>
        `;
    }

    // Load profile data
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileRole').value = currentUser.role || '';

    // Add company form listener for vendor
    if (currentUser.role === 'vendor') {
        document.getElementById('companyProfileForm')?.addEventListener('submit', updateCompanyProfile);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Sidebar tab switching
    document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            switchTab(tabName);
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            closeSidebar();
        });
    });

    // Sidebar toggle (mobile)
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);

    // Logout
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Event modal
    document.getElementById('closeEventModal')?.addEventListener('click', closeEventModal);
    document.getElementById('cancelEventBtn')?.addEventListener('click', closeEventModal);
    document.getElementById('saveEventBtn')?.addEventListener('click', saveEvent);
    document.getElementById('eventModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeEventModal();
    });

    // Event filter
    document.getElementById('eventFilter')?.addEventListener('change', (e) => {
        filterEvents(e.target.value);
    });

    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', updateProfile);

    // Password form
    document.getElementById('passwordForm')?.addEventListener('submit', changePassword);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });
}

/**
 * Toggle sidebar (mobile)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Handle logout - Global function
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        ApiService.clearAuth();
        Toast.success('Logged out successfully');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

/**
 * Switch tabs
 */
function switchTab(tabName) {
    const tabMap = {
        'events': 'eventsTab',
        'registrations': 'registrationsTab',
        'vendors': 'vendorsTab',
        'services': 'servicesTab',
        'company': 'companyTab',
        'profile': 'profileTab'
    };

    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    const activePane = document.getElementById(tabMap[tabName]);
    if (activePane) {
        activePane.classList.add('active');
    }

    // Load data for specific tabs
    if (tabName === 'vendors') loadVendors();
    if (tabName === 'services') loadServices();
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        Helpers.showLoading();
        await loadEvents();
        await loadRegistrations();
        updateStats();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Load events
 */
async function loadEvents() {
    try {
        const response = await ApiService.get('/events');
        if (response.success) {
            currentEvents = response.data || [];
            renderEvents(currentEvents);
        }
    } catch (error) {
        console.error('Failed to load events:', error);
        renderEvents([]);
    }
}

/**
 * Load registrations
 */
async function loadRegistrations() {
    try {
        const response = await ApiService.get('/registrations');
        if (response.success) {
            currentRegistrations = response.data || [];
            renderRegistrations(currentRegistrations);
        }
    } catch (error) {
        console.error('Failed to load registrations:', error);
        renderRegistrations([]);
    }
}

/**
 * Load vendors (admin only)
 */
async function loadVendors() {
    try {
        const response = await ApiService.get('/vendors');
        if (response.success) {
            currentVendors = response.data || [];
            renderVendorManagement(currentVendors);
        }
    } catch (error) {
        console.error('Failed to load vendors:', error);
    }
}

/**
 * Load services (vendor only)
 */
async function loadServices() {
    try {
        const response = await ApiService.get('/services/my');
        if (response.success) {
            currentServices = response.data || [];
            renderServices(currentServices);
        }
    } catch (error) {
        // If endpoint doesn't exist yet, show empty
        renderServices([]);
    }
}

/**
 * Render events table
 */
function renderEvents(events) {
    const tbody = document.getElementById('eventsTableBody');

    if (!events || events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No events found</p>
                ${currentUser.role === 'admin' ? '<button class="btn btn-primary" onclick="openEventModal()">Create Your First Event</button>' : ''}
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td><strong>${Helpers.sanitizeHTML(event.title)}</strong>
                ${event.description ? `<br><small class="text-muted">${Helpers.truncateText(event.description, 50)}</small>` : ''}</td>
            <td>${Helpers.formatDate(event.date)} ${event.time ? Helpers.formatTime(event.time) : ''}</td>
            <td>${event.available_slots !== null ? `${event.available_slots}/${event.capacity}` : event.capacity}</td>
            <td><span class="badge ${Helpers.getStatusBadgeClass(event.status)}">${event.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" title="View" onclick="viewEvent(${event.id})">
                        <i class="fas fa-eye"></i></button>
                    ${currentUser.role === 'admin' ? `
                    <button class="action-btn edit" title="Edit" onclick="editEvent(${event.id})">
                        <i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Delete" onclick="deleteEvent(${event.id})">
                        <i class="fas fa-trash"></i></button>
                    <button class="action-btn view" title="Export CSV" onclick="exportRegistrations(${event.id})" style="background-color: rgba(72,187,120,0.1); color: var(--success);">
                        <i class="fas fa-download"></i></button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render registrations table
 */
function renderRegistrations(registrations) {
    const tbody = document.getElementById('registrationsTableBody');

    if (!registrations || registrations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <p>No registrations yet</p>
                <button class="btn btn-primary" onclick="switchTab('events')">Browse Events</button>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = registrations.map(reg => `
        <tr>
            <td><strong>${Helpers.sanitizeHTML(reg.event_title || 'Event')}</strong></td>
            <td>${reg.event_date ? Helpers.formatDate(reg.event_date) : 'N/A'}</td>
            <td><span class="badge ${Helpers.getStatusBadgeClass(reg.status)}">${reg.status}</span></td>
            <td>${Helpers.formatDate(reg.registration_date)}</td>
            <td>
                <div class="action-buttons">
                    ${reg.qr_code ? `
                    <button class="action-btn view" title="View QR Code" onclick="showQRCode(${reg.id})">
                        <i class="fas fa-qrcode"></i>
                    </button>` : ''}
                    ${reg.status === 'registered' ? `
                    <button class="action-btn delete" title="Cancel" onclick="cancelRegistration(${reg.id})">
                        <i class="fas fa-times"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render vendor management table (admin) with full actions
 */
function renderVendorManagement(vendors) {
    const tbody = document.getElementById('vendorsTableBody');

    if (!vendors || vendors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No vendor registrations found</p>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = vendors.map(vendor => `
        <tr>
            <td>
                <strong>${Helpers.sanitizeHTML(vendor.company_name)}</strong>
                ${vendor.description ? `<br><small class="text-muted">${Helpers.truncateText(vendor.description, 40)}</small>` : ''}
            </td>
            <td><span class="vendor-type">${vendor.service_type || 'N/A'}</span></td>
            <td>
                ${vendor.contact_email ? `<div><i class="fas fa-envelope"></i> ${vendor.contact_email}</div>` : ''}
                ${vendor.contact_phone ? `<div><i class="fas fa-phone"></i> ${vendor.contact_phone}</div>` : ''}
                ${!vendor.contact_email && !vendor.contact_phone ? 'N/A' : ''}
            </td>
            <td>
                <span class="badge ${vendor.is_approved ? 'badge-success' : 'badge-warning'}">
                    ${vendor.is_approved ? 'Approved' : 'Pending'}
                </span>
            </td>
            <td>${Helpers.formatDate(vendor.created_at)}</td>
            <td>
                ${vendor.website ? `<a href="${vendor.website}" target="_blank" class="btn btn-outline btn-sm"><i class="fas fa-globe"></i></a>` : 'N/A'}
            </td>
            <td>
                <div class="action-buttons">
                    ${!vendor.is_approved ? `
                        <button class="action-btn edit" title="Approve Vendor" onclick="approveVendor(${vendor.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn delete" title="Reject Vendor" onclick="rejectVendor(${vendor.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : `
                        <button class="action-btn delete" title="Revoke Approval" onclick="revokeVendor(${vendor.id})">
                            <i class="fas fa-undo"></i>
                        </button>
                    `}
                    <button class="action-btn view" title="View Details" onclick="viewVendorDetail(${vendor.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Approve vendor
 */
async function approveVendor(vendorId) {
    if (!confirm('Approve this vendor? They will be able to offer services.')) return;

    try {
        Helpers.showLoading();
        await ApiService.patch(`/vendors/${vendorId}/approve`, { approved: true });
        Toast.success('Vendor approved successfully!');
        await loadVendors();
    } catch (error) {
        Toast.error(error.message || 'Failed to approve vendor');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Reject vendor
 */
async function rejectVendor(vendorId) {
    if (!confirm('Reject this vendor? This will deny their registration.')) return;

    try {
        Helpers.showLoading();
        await ApiService.patch(`/vendors/${vendorId}/approve`, { approved: false });
        Toast.success('Vendor rejected');
        await loadVendors();
    } catch (error) {
        Toast.error(error.message || 'Failed to reject vendor');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Revoke vendor approval
 */
async function revokeVendor(vendorId) {
    if (!confirm('Revoke approval for this vendor? Their services will be hidden.')) return;

    try {
        Helpers.showLoading();
        await ApiService.patch(`/vendors/${vendorId}/approve`, { approved: false });
        Toast.success('Vendor approval revoked');
        await loadVendors();
    } catch (error) {
        Toast.error(error.message || 'Failed to revoke approval');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * View vendor details
 */
async function viewVendorDetail(vendorId) {
    try {
        Helpers.showLoading();
        const response = await ApiService.get(`/vendors/${vendorId}`);

        if (response.success) {
            const vendor = response.data;

            // Build detail HTML
            const servicesHtml = vendor.services && vendor.services.length > 0
                ? vendor.services.map(s => `
                    <tr>
                        <td>${Helpers.sanitizeHTML(s.name)}</td>
                        <td>${Helpers.formatCurrency(s.price)}</td>
                        <td>${s.duration || 'N/A'}</td>
                        <td><span class="badge ${s.is_available ? 'badge-success' : 'badge-danger'}">${s.is_available ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="4" class="text-center">No services added yet</td></tr>';

            Swal.fire({
                title: vendor.company_name,
                html: `
                    <div style="text-align:left;">
                        <p><strong>Service Type:</strong> ${vendor.service_type}</p>
                        <p><strong>Description:</strong> ${vendor.description || 'N/A'}</p>
                        <p><strong>Email:</strong> ${vendor.contact_email || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${vendor.contact_phone || 'N/A'}</p>
                        <p><strong>Website:</strong> ${vendor.website ? `<a href="${vendor.website}" target="_blank">${vendor.website}</a>` : 'N/A'}</p>
                        <p><strong>Address:</strong> ${vendor.address || 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="badge ${vendor.is_approved ? 'badge-success' : 'badge-warning'}">${vendor.is_approved ? 'Approved' : 'Pending'}</span></p>
                        <p><strong>Registered:</strong> ${Helpers.formatDate(vendor.created_at)}</p>
                        <hr>
                        <h5>Services (${vendor.services ? vendor.services.length : 0})</h5>
                        <table class="table" style="width:100%;font-size:0.85rem;">
                            <thead><tr><th>Name</th><th>Price</th><th>Duration</th><th>Status</th></tr></thead>
                            <tbody>${servicesHtml}</tbody>
                        </table>
                    </div>
                `,
                width: '700px',
                confirmButtonText: 'Close',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        Toast.error('Failed to load vendor details');
    } finally {
        Helpers.hideLoading();
    }
}
/**
 * Render services (vendor)
 */
function renderServices(services) {
    const tbody = document.getElementById('servicesTableBody');

    if (!services || services.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="empty-state">
                <i class="fas fa-tools"></i>
                <p>No services added yet</p>
                <button class="btn btn-primary" onclick="openServiceModal()">Add Your First Service</button>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = services.map(service => `
        <tr>
            <td><strong>${Helpers.sanitizeHTML(service.name)}</strong></td>
            <td>${Helpers.truncateText(service.description || '', 50)}</td>
            <td>${Helpers.formatCurrency(service.price)}</td>
            <td><span class="badge ${service.is_available ? 'badge-success' : 'badge-danger'}">${service.is_available ? 'Available' : 'Unavailable'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editService(${service.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteService(${service.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update stats
 */
function updateStats() {
    document.getElementById('totalEventsStat').textContent = currentEvents.length;
    document.getElementById('totalRegistrationsStat').textContent = currentRegistrations.length;
    document.getElementById('upcomingEventsStat').textContent = currentEvents.filter(e => e.status === 'published' && new Date(e.date) >= new Date()).length;
    document.getElementById('completedEventsStat').textContent = currentEvents.filter(e => e.status === 'completed').length;
}

/**
 * Filter events
 */
function filterEvents(status) {
    if (status === 'all') {
        renderEvents(currentEvents);
    } else {
        renderEvents(currentEvents.filter(e => e.status === status));
    }
}

// ===== EVENT MODAL =====
function openEventModal(event = null) {
    const modal = document.getElementById('eventModal');
    document.getElementById('eventModalTitle').textContent = event ? 'Edit Event' : 'Create New Event';
    document.getElementById('saveEventBtn').textContent = event ? 'Update Event' : 'Create Event';
    isEditing = !!event;

    if (event) {
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventCapacity').value = event.capacity || '';
        document.getElementById('eventStatus').value = event.status || 'draft';
    } else {
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventStatus').value = 'draft';
    }
    modal.classList.remove('d-none');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('d-none');
    document.getElementById('eventForm').reset();
    isEditing = false;
}

async function saveEvent() {
    const eventId = document.getElementById('eventId').value;
    const eventData = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value || null,
        location: document.getElementById('eventLocation').value.trim(),
        capacity: parseInt(document.getElementById('eventCapacity').value),
        status: document.getElementById('eventStatus').value
    };

    if (!eventData.title || !eventData.date || !eventData.location || !eventData.capacity) {
        Toast.warning('Please fill in all required fields');
        return;
    }

    try {
        Helpers.showLoading();
        const response = isEditing && eventId
            ? await ApiService.put(`/events/${eventId}`, eventData)
            : await ApiService.post('/events', eventData);

        if (response.success) {
            Toast.success(isEditing ? 'Event updated!' : 'Event created!');
            closeEventModal();
            await loadEvents();
            updateStats();
        }
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

async function editEvent(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (event) openEventModal(event);
}

async function deleteEvent(eventId) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
        Helpers.showLoading();
        await ApiService.delete(`/events/${eventId}`);
        Toast.success('Event deleted');
        await loadEvents();
        updateStats();
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Export event registrations as CSV
 */
async function exportRegistrations(eventId) {
    try {
        Toast.info('Generating CSV report...');
        const response = await fetch(`${CONFIG.API_URL}/reports/events/${eventId}/export`, {
            headers: {
                'Authorization': `Bearer ${ApiService.getToken()}`
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-${eventId}-registrations.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        Toast.success('CSV exported successfully!');
    } catch (error) {
        Toast.error(error.message || 'Failed to export');
    }
}

/**
 * View event - opens registration popup for employee/vendor
 * Admin still goes to detail page
 */
function viewEvent(eventId) {
    if (currentUser.role === 'admin') {
        window.location.href = `event-detail.html?id=${eventId}`;
        return;
    }

    // For employee/vendor, show registration popup
    const event = currentEvents.find(e => e.id === eventId);
    if (event) {
        showRegisterPopup(event);
    }
}

/**
 * Show registration popup with event details
 */
function showRegisterPopup(event) {
    // Check if already registered
    const isRegistered = currentRegistrations.some(r =>
        r.event_id === event.id && r.status === 'registered'
    );

    document.getElementById('popupEventTitle').textContent = event.title;
    document.getElementById('popupDate').textContent = Helpers.formatDate(event.date);
    document.getElementById('popupTime').textContent = event.time ? Helpers.formatTime(event.time) : 'TBD';
    document.getElementById('popupLocation').textContent = event.location;
    document.getElementById('popupSlots').textContent = event.available_slots;
    document.getElementById('popupDescription').textContent = Helpers.truncateText(event.description || 'No description available.', 200);

    const statusEl = document.getElementById('popupStatus');
    const confirmBtn = document.getElementById('confirmRegisterBtn');
    const errorEl = document.getElementById('popupError');

    errorEl.classList.add('d-none');

    if (event.status !== 'published') {
        statusEl.innerHTML = `<span class="badge badge-warning">Event is ${event.status}</span>`;
        confirmBtn.style.display = 'none';
    } else if (isRegistered) {
        statusEl.innerHTML = `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Already Registered</span>`;
        confirmBtn.style.display = 'none';
    } else if (event.available_slots <= 0) {
        statusEl.innerHTML = `<span class="badge badge-danger">Fully Booked</span>`;
        confirmBtn.style.display = 'none';
    } else {
        statusEl.innerHTML = '';
        confirmBtn.style.display = 'inline-flex';
        confirmBtn.dataset.eventId = event.id;
    }

    document.getElementById('registerPopupModal').classList.remove('d-none');
}

/**
 * Close registration popup
 */
function closeRegisterPopup() {
    document.getElementById('registerPopupModal').classList.add('d-none');
}

/**
 * Confirm registration from popup
 */
async function confirmRegister() {
    const eventId = document.getElementById('confirmRegisterBtn').dataset.eventId;

    if (!eventId) return;

    try {
        Helpers.showLoading();
        const response = await ApiService.post('/registrations', { eventId: parseInt(eventId) });

        if (response.success) {
            Toast.success('Successfully registered! 🎉');
            closeRegisterPopup();
            await loadRegistrations();
            await loadEvents();
            updateStats();
        }
    } catch (error) {
        const errorEl = document.getElementById('popupError');
        errorEl.textContent = error.message || 'Registration failed';
        errorEl.classList.remove('d-none');
    } finally {
        Helpers.hideLoading();
    }
}
// ===== REGISTRATION =====
async function cancelRegistration(registrationId) {
    if (!confirm('Cancel this registration?')) return;
    try {
        Helpers.showLoading();
        await ApiService.delete(`/registrations/${registrationId}`);
        Toast.success('Registration cancelled');
        await loadRegistrations();
        await loadEvents();
        updateStats();
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

// ===== VENDOR APPROVAL (Admin) =====
async function toggleVendorApproval(vendorId, approved) {
    try {
        Helpers.showLoading();
        await ApiService.patch(`/vendors/${vendorId}/approve`, { approved });
        Toast.success(`Vendor ${approved ? 'approved' : 'rejected'}`);
        await loadVendors();
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

// ===== SERVICES (Vendor) =====
function openServiceModal(service = null) {
    // Will be fully implemented with service form
    Toast.info('Service management coming in full Module 4 implementation');
}

function editService(serviceId) {
    Toast.info('Edit service coming soon');
}

async function deleteService(serviceId) {
    if (!confirm('Delete this service?')) return;
    try {
        await ApiService.delete(`/services/${serviceId}`);
        Toast.success('Service deleted');
        await loadServices();
    } catch (error) {
        Toast.error(error.message);
    }
}

// ===== PROFILE =====
async function updateProfile(e) {
    e.preventDefault();
    const profileData = {
        name: document.getElementById('profileName').value.trim(),
        phone: document.getElementById('profilePhone').value.trim()
    };
    if (!profileData.name) { Toast.warning('Name is required'); return; }

    try {
        Helpers.showLoading();
        const response = await ApiService.put('/auth/profile', profileData);
        if (response.success) {
            Toast.success('Profile updated!');
            const updatedUser = { ...currentUser, ...profileData };
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
            currentUser = updatedUser;
            document.getElementById('userName').textContent = updatedUser.name;
            document.getElementById('sidebarUserName').textContent = updatedUser.name;
        }
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

async function changePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        Toast.warning('All fields required'); return;
    }
    if (newPassword.length < 8) { Toast.warning('Password too short'); return; }
    if (newPassword !== confirmNewPassword) { Toast.warning('Passwords do not match'); return; }

    try {
        Helpers.showLoading();
        await ApiService.put('/auth/change-password', { currentPassword, newPassword });
        Toast.success('Password changed! Please login again.');
        document.getElementById('passwordForm').reset();
        setTimeout(() => { ApiService.clearAuth(); window.location.href = 'login.html'; }, 1500);
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

// ===== SERVICE MANAGEMENT (Vendor) =====

/**
 * Open service modal for create/edit
 */
function openServiceModal(service = null) {
    const modal = document.getElementById('serviceModal');
    const title = document.getElementById('serviceModalTitle');
    const saveBtn = document.getElementById('saveServiceBtn');

    if (service) {
        title.textContent = 'Edit Service';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Service';
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name || '';
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('servicePrice').value = service.price || '';
        document.getElementById('serviceDuration').value = service.duration || '';
        document.getElementById('serviceAvailable').checked = service.is_available;
    } else {
        title.textContent = 'Add New Service';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Service';
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceAvailable').checked = true;
    }

    modal.classList.remove('d-none');
}

/**
 * Close service modal
 */
function closeServiceModal() {
    document.getElementById('serviceModal').classList.add('d-none');
    document.getElementById('serviceForm').reset();
}

/**
 * Save service (create or update)
 */
async function saveService() {
    const serviceId = document.getElementById('serviceId').value;
    const serviceData = {
        name: document.getElementById('serviceName').value.trim(),
        description: document.getElementById('serviceDescription').value.trim(),
        price: parseFloat(document.getElementById('servicePrice').value) || 0,
        duration: document.getElementById('serviceDuration').value.trim(),
        isAvailable: document.getElementById('serviceAvailable').checked
    };

    if (!serviceData.name || serviceData.price === undefined) {
        Toast.warning('Service name and price are required');
        return;
    }

    try {
        Helpers.showLoading();

        let response;
        if (serviceId) {
            response = await ApiService.put(`/services/${serviceId}`, serviceData);
        } else {
            response = await ApiService.post('/services', serviceData);
        }

        if (response.success) {
            Toast.success(serviceId ? 'Service updated!' : 'Service created!');
            closeServiceModal();
            await loadServices();
        }
    } catch (error) {
        Toast.error(error.message || 'Failed to save service');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Edit service
 */
function editService(serviceId) {
    const service = currentServices.find(s => s.id === serviceId);
    if (service) {
        openServiceModal(service);
    } else {
        Toast.error('Service not found');
    }
}

/**
 * Delete service
 */
async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;

    try {
        Helpers.showLoading();
        await ApiService.delete(`/services/${serviceId}`);
        Toast.success('Service deleted successfully');
        await loadServices();
    } catch (error) {
        Toast.error(error.message || 'Failed to delete service');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Toggle service availability
 */
async function toggleServiceAvailability(serviceId) {
    try {
        const response = await ApiService.patch(`/services/${serviceId}/toggle`);
        if (response.success) {
            Toast.success(response.message);
            await loadServices();
        }
    } catch (error) {
        Toast.error(error.message);
    }
}

/**
 * Load services (vendor only)
 */
async function loadServices() {
    try {
        const response = await ApiService.get('/services/my/list');
        if (response.success) {
            currentServices = response.data || [];
            renderServices(currentServices);
        }
    } catch (error) {
        console.error('Failed to load services:', error);
        currentServices = [];
        renderServices([]);
    }
}

/**
 * Render services table
 */
function renderServices(services) {
    const tbody = document.getElementById('servicesTableBody');

    if (!services || services.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="empty-state">
                <i class="fas fa-tools"></i>
                <p>No services added yet</p>
                <button class="btn btn-primary" onclick="openServiceModal()">
                    <i class="fas fa-plus"></i> Add Your First Service
                </button>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = services.map(service => `
        <tr>
            <td>
                <strong>${Helpers.sanitizeHTML(service.name)}</strong>
                ${service.description ? `<br><small class="text-muted">${Helpers.truncateText(service.description, 60)}</small>` : ''}
            </td>
            <td>${Helpers.truncateText(service.description || 'No description', 40)}</td>
            <td><strong>${Helpers.formatCurrency(service.price)}</strong></td>
            <td>
                <span class="badge ${service.is_available ? 'badge-success' : 'badge-danger'}" 
                      style="cursor:pointer" 
                      onclick="toggleServiceAvailability(${service.id})">
                    ${service.is_available ? 'Available' : 'Disabled'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" title="Edit" onclick="editService(${service.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" title="Delete" onclick="deleteService(${service.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Load vendor profile
 */
async function loadVendorProfile() {
    try {
        const response = await ApiService.get('/vendors/my-profile');
        if (response.success) {
            currentVendor = response.data;
            renderVendorProfile(currentVendor);
        }
    } catch (error) {
        console.error('Failed to load vendor profile:', error);
    }
}

/**
 * Render vendor profile in a tab
 */
function renderVendorProfile(vendor) {
    const container = document.getElementById('vendorProfileContent');
    if (!container) return;

    container.innerHTML = `
        <div class="vendor-profile-card">
            <h3>${Helpers.sanitizeHTML(vendor.company_name)}</h3>
            <p><strong>Service Type:</strong> ${vendor.service_type}</p>
            <p><strong>Email:</strong> ${vendor.contact_email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${vendor.contact_phone || 'N/A'}</p>
            <p><strong>Website:</strong> ${vendor.website || 'N/A'}</p>
            <p><strong>Status:</strong> 
                <span class="badge ${vendor.is_approved ? 'badge-success' : 'badge-warning'}">
                    ${vendor.is_approved ? 'Approved' : 'Pending Approval'}
                </span>
            </p>
        </div>
    `;
}

/**
 * Filter vendors by approval status
 */
async function filterVendors(status) {
    try {
        let endpoint = '/vendors';
        if (status !== 'all') {
            endpoint += `?approved=${status}`;
        }
        const response = await ApiService.get(endpoint);
        if (response.success) {
            currentVendors = response.data || [];
            renderVendorManagement(currentVendors);
        }
    } catch (error) {
        console.error('Failed to filter vendors:', error);
    }
}

// ===== COMPANY DETAILS (Vendor) =====

/**
 * Load vendor profile
 */
async function loadVendorProfile() {
    try {
        const response = await ApiService.get('/vendors/my-profile');
        if (response.success) {
            currentVendor = response.data;
            renderCompanyDetails(currentVendor);
        }
    } catch (error) {
        console.error('Failed to load vendor profile:', error);
        // If no vendor profile, show register prompt
        if (error.statusCode === 404) {
            document.getElementById('vendorStatusInfo').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store"></i>
                    <p>No vendor profile yet</p>
                    <a href="vendor-register.html" class="btn btn-primary">Register as Vendor</a>
                </div>
            `;
        }
    }
}

/**
 * Render company details form
 */
function renderCompanyDetails(vendor) {
    // Fill form
    document.getElementById('companyNameField').value = vendor.company_name || '';
    document.getElementById('companyServiceType').value = vendor.service_type || '';
    document.getElementById('companyDescription').value = vendor.description || '';
    document.getElementById('companyEmail').value = vendor.contact_email || '';
    document.getElementById('companyPhone').value = vendor.contact_phone || '';
    document.getElementById('companyWebsite').value = vendor.website || '';
    document.getElementById('companyAddress').value = vendor.address || '';

    // Render approval status
    renderApprovalStatus(vendor);

    // Show approval badge in header
    const badge = document.getElementById('vendorApprovalBadge');
    badge.innerHTML = `<span class="badge ${vendor.is_approved ? 'badge-success' : 'badge-warning'}">
        ${vendor.is_approved ? 'Approved' : 'Pending Approval'}
    </span>`;
}

/**
 * Render approval status section
 */
function renderApprovalStatus(vendor) {
    const statusIcon = document.getElementById('vendorStatusIcon');
    const statusText = document.getElementById('vendorStatusText');
    const statusReason = document.getElementById('vendorStatusReason');
    const reasonText = document.getElementById('vendorReasonText');
    const reasonDate = document.getElementById('vendorReasonDate');
    const historyList = document.getElementById('vendorHistoryList');

    if (vendor.is_approved) {
        statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        statusIcon.className = 'status-icon approved';
        statusText.textContent = 'Your company is approved and visible to clients';
        statusText.style.color = 'var(--success)';

        // Show reason if exists (from previous rejection)
        if (vendor.status_reason) {
            statusReason.style.display = 'block';
            reasonText.textContent = vendor.status_reason;
            reasonDate.textContent = vendor.status_updated_at ? `Updated: ${Helpers.formatDate(vendor.status_updated_at)}` : '';
        } else {
            statusReason.style.display = 'none';
        }
    } else {
        statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
        statusIcon.className = 'status-icon pending';
        statusText.textContent = 'Your company is pending admin approval';
        statusText.style.color = 'var(--warning)';

        if (vendor.status_reason) {
            statusReason.style.display = 'block';
            statusText.textContent = 'Your company needs updates';
            statusText.style.color = 'var(--danger)';
            reasonText.textContent = vendor.status_reason;
            reasonDate.textContent = vendor.status_updated_at ? `Updated: ${Helpers.formatDate(vendor.status_updated_at)}` : '';
        } else {
            statusReason.style.display = 'none';
        }
    }

    // Render status history
    if (vendor.status_history && vendor.status_history.length > 0) {
        historyList.innerHTML = vendor.status_history.map(h => `
            <div class="history-item">
                <div class="history-dot ${h.new_status ? 'approved' : 'rejected'}"></div>
                <div>
                    <strong>${h.new_status ? 'Approved' : 'Rejected'}</strong> by ${h.changed_by_name}
                    ${h.reason ? `<br><small class="text-muted">Reason: ${h.reason}</small>` : ''}
                    <br><small class="text-muted">${Helpers.formatDate(h.created_at)}</small>
                </div>
            </div>
        `).join('');
    } else {
        historyList.innerHTML = '<p class="text-muted">No status history yet</p>';
    }
}

/**
 * Update company profile
 */
async function updateCompanyProfile(e) {
    e.preventDefault();

    const vendorId = currentVendor?.id;
    if (!vendorId) {
        Toast.error('Vendor profile not found');
        return;
    }

    const data = {
        companyName: document.getElementById('companyNameField').value.trim(),
        serviceType: document.getElementById('companyServiceType').value,
        description: document.getElementById('companyDescription').value.trim(),
        contactEmail: document.getElementById('companyEmail').value.trim(),
        contactPhone: document.getElementById('companyPhone').value.trim(),
        website: document.getElementById('companyWebsite').value.trim(),
        address: document.getElementById('companyAddress').value.trim()
    };

    if (!data.companyName || !data.serviceType) {
        Toast.warning('Company name and service type are required');
        return;
    }

    try {
        Helpers.showLoading();
        const response = await ApiService.put(`/vendors/${vendorId}`, data);
        if (response.success) {
            Toast.success('Company details updated!');
            await loadVendorProfile();
        }
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

// ===== VENDOR APPROVAL (Admin) =====
async function toggleVendorApproval(vendorId, approved) {
    try {
        Helpers.showLoading();
        await ApiService.patch(`/vendors/${vendorId}/approve`, { approved });
        Toast.success(`Vendor ${approved ? 'approved' : 'rejected'}`);
        await loadVendors();
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

// Global
window.switchTab = switchTab;
window.openEventModal = openEventModal;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewEvent = viewEvent;
window.exportRegistrations = exportRegistrations;
window.cancelRegistration = cancelRegistration;
window.toggleVendorApproval = toggleVendorApproval;
window.openServiceModal = openServiceModal;
window.editService = editService;
window.deleteService = deleteService;
window.closeRegisterPopup = closeRegisterPopup;
window.confirmRegister = confirmRegister;
window.handleLogout = handleLogout;
window.approveVendor = approveVendor;
window.rejectVendor = rejectVendor;
window.revokeVendor = revokeVendor;
window.viewVendorDetail = viewVendorDetail;
window.filterVendors = filterVendors;
window.closeVendorActionModal = closeVendorActionModal;
window.confirmVendorAction = confirmVendorAction;

// ===== QR CODE =====

/**
 * Show QR code for a registration
 */
function showQRCode(registrationId) {
    const registration = currentRegistrations.find(r => r.id === registrationId);
    
    if (!registration || !registration.qr_code) {
        Toast.error('QR code not available');
        return;
    }
    
    document.getElementById('qrCodeImage').src = registration.qr_code;
    document.getElementById('qrEventName').textContent = registration.event_title || 'Event';
    document.getElementById('qrCodeModal').classList.remove('d-none');
}

/**
 * Close QR code modal
 */
function closeQRModal() {
    document.getElementById('qrCodeModal').classList.add('d-none');
}

/**
 * Download QR code as image
 */
function downloadQRCode() {
    const img = document.getElementById('qrCodeImage');
    const link = document.createElement('a');
    link.download = 'event-qr-code.png';
    link.href = img.src;
    link.click();
    Toast.success('QR Code downloaded!');
}

// Export functions to global scope
window.showQRCode = showQRCode;
window.closeQRModal = closeQRModal;
window.downloadQRCode = downloadQRCode;
