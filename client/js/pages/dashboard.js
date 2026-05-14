/**
 * Dashboard Page Script
 * Enhanced with sidebar navigation
 */

let currentUser = null;
let currentEvents = [];
let currentRegistrations = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = ApiService.getCurrentUser();
    
    // Initialize dashboard
    initDashboard();
    setupEventListeners();
    loadDashboardData();
});

function initDashboard() {
    // Set user info
    document.getElementById('userName').textContent = currentUser.name || 'User';
    document.getElementById('sidebarUserName').textContent = currentUser.name || 'User';
    document.getElementById('sidebarUserRole').textContent = currentUser.role || 'user';
    
    // Set avatar initial
    const avatar = document.getElementById('userAvatar');
    if (avatar && currentUser.name) {
        avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
    
    // Role-based UI adjustments
    const createEventBtn = document.getElementById('createEventBtn');
    const sidebarVendorsMenu = document.getElementById('sidebarVendorsMenu');
    const headerActions = document.getElementById('headerActions');
    
    if (currentUser.role === 'admin') {
        // Admin: Full access
        if (createEventBtn) createEventBtn.style.display = 'inline-flex';
        if (sidebarVendorsMenu) sidebarVendorsMenu.style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Manage events, vendors, and track registrations';
        document.getElementById('eventFilter').style.display = 'inline-block';
        
    } else if (currentUser.role === 'vendor') {
        // Vendor: Can manage their services, view events
        if (createEventBtn) createEventBtn.style.display = 'none';
        if (sidebarVendorsMenu) sidebarVendorsMenu.style.display = 'block';
        document.getElementById('dashboardSubtitle').textContent = 'Manage your services and view event bookings';
        
        // Change create event button to add service button
        if (headerActions) {
            headerActions.innerHTML = `
                <button class="btn btn-primary" onclick="window.location.href='vendor-services.html'">
                    <i class="fas fa-plus"></i> Add Service
                </button>
            `;
        }
        
        // Hide event filter for vendors (they only see published events)
        const eventFilter = document.getElementById('eventFilter');
        if (eventFilter) eventFilter.style.display = 'none';
        
    } else {
        // Employee: Can browse events and manage registrations
        if (createEventBtn) createEventBtn.style.display = 'none';
        if (sidebarVendorsMenu) sidebarVendorsMenu.style.display = 'none';
        document.getElementById('dashboardSubtitle').textContent = 'Browse events and manage your registrations';
        
        // Change create event button to browse events button
        if (headerActions) {
            headerActions.innerHTML = `
                <button class="btn btn-primary" onclick="window.location.href='events.html'">
                    <i class="fas fa-search"></i> Browse Events
                </button>
            `;
        }
        
        // Hide event filter and show only published events
        const eventFilter = document.getElementById('eventFilter');
        if (eventFilter) eventFilter.style.display = 'none';
    }
    
    // Load profile data
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileRole').value = currentUser.role || '';
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            switchTab(tabName);
            
            // Update active state in sidebar
            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            
            // Close sidebar on mobile
            closeSidebar();
        });
    });
    
    // Sidebar toggle button (mobile)
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    
    // Sidebar overlay (click to close)
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
    
    // Sidebar logout button
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // Top navbar logout (if exists)
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // Create event button
    document.getElementById('createEventBtn')?.addEventListener('click', () => {
        openEventModal();
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
    
    // Keyboard shortcut to close sidebar (Escape)
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
    
    // Prevent body scroll when sidebar is open
    if (sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

/**
 * Close sidebar (mobile)
 */
function closeSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Handle logout
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
 * Switch dashboard tabs
 */
function switchTab(tabName) {
    const tabMap = {
        'events': 'eventsTab',
        'registrations': 'registrationsTab',
        'profile': 'profileTab',
        'vendors': 'eventsTab' // For now, vendors tab shows events
    };
    
    // Hide all panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Show selected pane
    const activePane = document.getElementById(tabMap[tabName]);
    if (activePane) {
        activePane.classList.add('active');
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        Helpers.showLoading();
        
        await loadEvents();
        await loadRegistrations();
        await loadProfile();
        updateStats();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        Toast.error('Failed to load some dashboard data');
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
 * Load profile
 */
async function loadProfile() {
    try {
        const response = await ApiService.get('/auth/profile');
        if (response.success) {
            const user = response.data;
            document.getElementById('profileName').value = user.name || '';
            document.getElementById('profilePhone').value = user.phone || '';
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
            currentUser = user;
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

/**
 * Render events table
 */
function renderEvents(events) {
    const tbody = document.getElementById('eventsTableBody');
    
    if (!events || events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>No events found</p>
                        ${currentUser.role === 'admin' ? '<button class="btn btn-primary" onclick="openEventModal()">Create Your First Event</button>' : ''}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = events.map(event => `
        <tr>
            <td>
                <strong>${Helpers.sanitizeHTML(event.title)}</strong>
                ${event.description ? `<br><small class="text-muted">${Helpers.truncateText(event.description, 50)}</small>` : ''}
            </td>
            <td>${Helpers.formatDate(event.date)} ${event.time ? Helpers.formatTime(event.time) : ''}</td>
            <td>${event.available_slots !== null ? `${event.available_slots}/${event.capacity}` : event.capacity}</td>
            <td><span class="badge ${Helpers.getStatusBadgeClass(event.status)}">${event.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" title="View" onclick="viewEvent(${event.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser.role === 'admin' ? `
                        <button class="action-btn edit" title="Edit" onclick="editEvent(${event.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="deleteEvent(${event.id})">
                            <i class="fas fa-trash"></i>
                        </button>
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
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-ticket-alt"></i>
                        <p>No registrations yet</p>
                        <a href="events.html" class="btn btn-primary">Browse Events</a>
                    </div>
                </td>
            </tr>
        `;
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
                    ${reg.qr_token ? `
                        <button class="action-btn view" title="View QR Code" onclick="showQRCode('${reg.qr_token}')">
                            <i class="fas fa-qrcode"></i>
                        </button>
                    ` : ''}
                    ${reg.status === 'registered' ? `
                        <button class="action-btn delete" title="Cancel" onclick="cancelRegistration(${reg.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update dashboard stats
 */
function updateStats() {
    const totalEvents = currentEvents.length;
    const totalRegistrations = currentRegistrations.length;
    const upcoming = currentEvents.filter(e => e.status === 'published' && new Date(e.date) >= new Date()).length;
    const completed = currentEvents.filter(e => e.status === 'completed').length;
    
    document.getElementById('totalEventsStat').textContent = totalEvents;
    document.getElementById('totalRegistrationsStat').textContent = totalRegistrations;
    document.getElementById('upcomingEventsStat').textContent = upcoming;
    document.getElementById('completedEventsStat').textContent = completed;
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

/**
 * Open event modal
 */
function openEventModal(event = null) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    const saveBtn = document.getElementById('saveEventBtn');
    
    isEditing = !!event;
    
    if (event) {
        title.textContent = 'Edit Event';
        saveBtn.textContent = 'Update Event';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventCapacity').value = event.capacity || '';
        document.getElementById('eventStatus').value = event.status || 'draft';
    } else {
        title.textContent = 'Create New Event';
        saveBtn.textContent = 'Create Event';
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventStatus').value = 'draft';
    }
    
    modal.classList.remove('d-none');
}

/**
 * Close event modal
 */
function closeEventModal() {
    document.getElementById('eventModal').classList.add('d-none');
    document.getElementById('eventForm').reset();
    isEditing = false;
}

/**
 * Save event
 */
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
        
        let response;
        if (isEditing && eventId) {
            response = await ApiService.put(`/events/${eventId}`, eventData);
        } else {
            response = await ApiService.post('/events', eventData);
        }
        
        if (response.success) {
            Toast.success(isEditing ? 'Event updated!' : 'Event created!');
            closeEventModal();
            await loadEvents();
            updateStats();
        }
    } catch (error) {
        Toast.error(error.message || 'Failed to save event');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Edit event
 */
async function editEvent(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (event) openEventModal(event);
}

/**
 * Delete event
 */
async function deleteEvent(eventId) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    
    try {
        Helpers.showLoading();
        await ApiService.delete(`/events/${eventId}`);
        Toast.success('Event deleted');
        await loadEvents();
        updateStats();
    } catch (error) {
        Toast.error(error.message || 'Failed to delete event');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * View event
 */
function viewEvent(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}

/**
 * Cancel registration
 */
async function cancelRegistration(registrationId) {
    if (!confirm('Cancel this registration?')) return;
    
    try {
        Helpers.showLoading();
        await ApiService.delete(`/registrations/${registrationId}`);
        Toast.success('Registration cancelled');
        await loadRegistrations();
    } catch (error) {
        Toast.error(error.message || 'Failed to cancel');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Show QR code
 */
function showQRCode(qrToken) {
    Toast.info('QR Code feature coming in Module 5');
}

/**
 * Update profile
 */
async function updateProfile(e) {
    e.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value.trim(),
        phone: document.getElementById('profilePhone').value.trim()
    };
    
    if (!profileData.name) {
        Toast.warning('Name is required');
        return;
    }
    
    try {
        Helpers.showLoading();
        const response = await ApiService.put('/auth/profile', profileData);
        
        if (response.success) {
            Toast.success('Profile updated!');
            const updatedUser = { ...currentUser, ...profileData };
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
            currentUser = updatedUser;
            
            // Update displayed names
            document.getElementById('userName').textContent = updatedUser.name;
            document.getElementById('sidebarUserName').textContent = updatedUser.name;
            const avatar = document.getElementById('userAvatar');
            if (avatar) avatar.textContent = updatedUser.name.charAt(0).toUpperCase();
        }
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Change password
 */
async function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        Toast.warning('All fields are required');
        return;
    }
    
    if (newPassword.length < 8) {
        Toast.warning('Password must be at least 8 characters');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        Toast.warning('Passwords do not match');
        return;
    }
    
    try {
        Helpers.showLoading();
        await ApiService.put('/auth/change-password', { currentPassword, newPassword });
        Toast.success('Password changed! Please login again.');
        document.getElementById('passwordForm').reset();
        
        setTimeout(() => {
            ApiService.clearAuth();
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        Toast.error(error.message);
    } finally {
        Helpers.hideLoading();
    }
}

// Make functions globally available
window.openEventModal = openEventModal;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewEvent = viewEvent;
window.cancelRegistration = cancelRegistration;
window.showQRCode = showQRCode;