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

/**
 * Initialize dashboard based on role
 */
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
        // Admin: Show all menus
        document.getElementById('sidebarEventsMenu').style.display = 'block';
        document.getElementById('sidebarRegistrationsMenu').style.display = 'block';
        document.getElementById('sidebarVendorsMenu').style.display = 'block';
        document.getElementById('sidebarServicesMenu').style.display = 'none';
        document.getElementById('sidebarProfileMenu').style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Manage events, vendors, and registrations';
        
        headerActions.innerHTML = `
            <button class="btn btn-primary" onclick="openEventModal()">
                <i class="fas fa-plus"></i> Create Event
            </button>
        `;
        
    } else if (currentUser.role === 'vendor') {
        // Vendor: Show services and registrations
        document.getElementById('sidebarEventsMenu').style.display = 'block';
        document.getElementById('sidebarRegistrationsMenu').style.display = 'block';
        document.getElementById('sidebarVendorsMenu').style.display = 'none';
        document.getElementById('sidebarServicesMenu').style.display = 'block';
        document.getElementById('sidebarProfileMenu').style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Manage your services and view bookings';
        
        headerActions.innerHTML = `
            <button class="btn btn-primary" onclick="openServiceModal()">
                <i class="fas fa-plus"></i> Add Service
            </button>
        `;
        
    } else {
        // Employee: Only events and registrations
        document.getElementById('sidebarEventsMenu').style.display = 'block';
        document.getElementById('sidebarRegistrationsMenu').style.display = 'block';
        document.getElementById('sidebarVendorsMenu').style.display = 'none';
        document.getElementById('sidebarServicesMenu').style.display = 'none';
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

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        ApiService.clearAuth();
        Toast.success('Logged out successfully');
        setTimeout(() => window.location.href = 'login.html', 500);
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
                        <i class="fas fa-trash"></i></button>` : ''}
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
                    ${reg.status === 'registered' ? `
                    <button class="action-btn delete" title="Cancel" onclick="cancelRegistration(${reg.id})">
                        <i class="fas fa-times"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render vendor management (admin)
 */
function renderVendorManagement(vendors) {
    const tbody = document.getElementById('vendorsTableBody');
    
    if (!vendors || vendors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">
            <div class="empty-state"><i class="fas fa-store-slash"></i><p>No vendors found</p></div>
        </td></tr>`;
        return;
    }
    
    tbody.innerHTML = vendors.map(vendor => `
        <tr>
            <td><strong>${Helpers.sanitizeHTML(vendor.company_name)}</strong></td>
            <td>${vendor.service_type || 'N/A'}</td>
            <td>${vendor.contact_email || 'N/A'}</td>
            <td><span class="badge ${vendor.is_approved ? 'badge-success' : 'badge-warning'}">${vendor.is_approved ? 'Approved' : 'Pending'}</span></td>
            <td>${Helpers.formatDate(vendor.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn ${vendor.is_approved ? 'delete' : 'edit'}" 
                            title="${vendor.is_approved ? 'Revoke' : 'Approve'}" 
                            onclick="toggleVendorApproval(${vendor.id}, ${!vendor.is_approved})">
                        <i class="fas ${vendor.is_approved ? 'fa-times' : 'fa-check'}"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
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

function viewEvent(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
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

// Global
window.switchTab = switchTab;
window.openEventModal = openEventModal;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewEvent = viewEvent;
window.cancelRegistration = cancelRegistration;
window.toggleVendorApproval = toggleVendorApproval;
window.openServiceModal = openServiceModal;
window.editService = editService;
window.deleteService = deleteService;