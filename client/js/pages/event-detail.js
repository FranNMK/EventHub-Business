/**
 * Event Detail Page Script
 * Displays full event information and handles registration
 */

let currentEvent = null;
let eventId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get event ID from URL
    eventId = Helpers.getQueryParam('id');

    if (!eventId) {
        showError('No event specified');
        return;
    }

    loadEventDetail();
});

/**
 * Load event details from API
 */
async function loadEventDetail() {
    try {
        const response = await ApiService.get(`/events/${eventId}`);

        if (response.success) {
            currentEvent = response.data;
            renderEventDetail(currentEvent);
            document.getElementById('loadingState').classList.add('d-none');
            document.getElementById('eventContent').classList.remove('d-none');

            // Load attendees if admin
            if (ApiService.isAuthenticated()) {
                const user = ApiService.getCurrentUser();
                if (user.role === 'admin' && currentEvent.registrations) {
                    renderAttendees(currentEvent.registrations);
                }
                if (user.role === 'admin') {
                    document.getElementById('registrationListSection').classList.remove('d-none');
                }
            }
        } else {
            showError('Event not found');
        }
    } catch (error) {
        console.error('Failed to load event:', error);
        if (error.statusCode === 404) {
            showError('Event not found');
        } else {
            showError('Failed to load event details. Please try again.');
        }
    }
}

/**
 * Render event details
 */
function renderEventDetail(event) {
    // Set page title
    document.title = `${event.title} - EventHub Business`;

    // Hero section
    document.getElementById('heroTitle').textContent = event.title;
    document.getElementById('heroDate').textContent = Helpers.formatDate(event.date);
    document.getElementById('heroTime').textContent = event.time ? Helpers.formatTime(event.time) : 'TBD';
    document.getElementById('heroLocation').textContent = event.location;
    document.getElementById('heroCapacity').textContent = `${event.available_slots} / ${event.capacity} slots`;

    // Status badge
    const statusBadge = document.getElementById('heroStatus');
    statusBadge.textContent = event.status;
    statusBadge.className = `event-status-badge badge ${Helpers.getStatusBadgeClass(event.status)}`;

    // Description
    document.getElementById('eventDescription').textContent = event.description || 'No description available.';

    // Schedule
    document.getElementById('scheduleTime').textContent =
        `${Helpers.formatDate(event.date)} at ${event.time ? Helpers.formatTime(event.time) : 'TBD'}`;

    // Sidebar
    document.getElementById('sidebarDateTime').textContent =
        `${Helpers.formatDate(event.date)} at ${event.time ? Helpers.formatTime(event.time) : 'TBD'}`;
    document.getElementById('sidebarLocation').textContent = event.location;
    document.getElementById('sidebarOrganizer').textContent = event.creator_name || 'EventHub Admin';

    // Slots
    const slotsEl = document.getElementById('sidebarSlots');
    if (event.available_slots <= 0) {
        slotsEl.innerHTML = '<span class="text-danger">Fully Booked</span>';
    } else if (event.available_slots <= 5) {
        slotsEl.innerHTML = `<span class="text-warning">Only ${event.available_slots} left!</span>`;
    } else {
        slotsEl.textContent = `${event.available_slots} of ${event.capacity} available`;
    }

    // Render registration card
    renderRegistrationCard(event);
}

/**
 * Render registration card based on state
 */
function renderRegistrationCard(event) {
    const container = document.getElementById('registrationStatus');
    const isAuth = ApiService.isAuthenticated();
    const user = ApiService.getCurrentUser();

    // Slots bar
    const slotsPercentage = event.capacity > 0
        ? ((event.capacity - event.available_slots) / event.capacity) * 100
        : 0;

    let html = `
        <div class="slots-indicator">
            <div class="slots-bar">
                <div class="slots-fill" style="width: ${Math.min(slotsPercentage, 100)}%"></div>
            </div>
            <p class="slots-text">
                <span class="filled">${event.capacity - event.available_slots} registered</span> 
                · ${event.available_slots} spots left
            </p>
        </div>
    `;

    // Check event status
    if (event.status === 'cancelled') {
        html += `
            <div class="cancelled-badge">
                <i class="fas fa-ban"></i> This event has been cancelled
            </div>
        `;
    } else if (event.status === 'completed') {
        html += `
            <div class="badge badge-primary" style="display:block; padding:1rem;">
                <i class="fas fa-check-circle"></i> This event has ended
            </div>
        `;
    } else if (!isAuth) {
        html += `
        <p>Please login to register for this event.</p>
        <button class="btn btn-primary" onclick="redirectToLogin()">
            <i class="fas fa-sign-in-alt"></i> Login to Register
        </button>
        <p class="text-muted" style="margin-top:0.5rem; font-size:0.8rem;">
            Don't have an account? <a href="register.html">Register here</a>
        </p>
    `;
    } else if (event.available_slots <= 0) {
        html += `
            <div class="badge badge-danger" style="display:block; padding:1rem;">
                <i class="fas fa-times-circle"></i> Fully Booked
            </div>
            <p class="text-muted">No spots available at this time.</p>
        `;
    } else {
        // Check if user is already registered
        const isRegistered = event.registrations?.some(r => r.user_id === user.id);

        if (isRegistered) {
            const userReg = event.registrations.find(r => r.user_id === user.id);
            if (userReg?.status === 'cancelled') {
                html += `
                    <button class="btn btn-primary" onclick="registerForEvent()">
                        <i class="fas fa-ticket-alt"></i> Register Again
                    </button>
                `;
            } else {
                html += `
                    <div class="registered-badge">
                        <i class="fas fa-check-circle"></i> You're Registered!
                    </div>
                    <p class="text-muted" style="font-size:0.85rem;">
                        Registered on ${Helpers.formatDate(userReg?.registration_date)}
                    </p>
                    <button class="btn btn-outline-danger" onclick="cancelRegistration()">
                        <i class="fas fa-times"></i> Cancel Registration
                    </button>
                `;
            }
        } else {
            html += `
                <button class="btn btn-primary btn-lg" onclick="registerForEvent()">
                    <i class="fas fa-ticket-alt"></i> Register Now
                </button>
                <p class="text-muted" style="margin-top:0.5rem; font-size:0.8rem;">
                    Registration closes 48 hours before the event
                </p>
            `;
        }
    }

    container.innerHTML = html;
}

/**
 * Register for the event
 */
async function registerForEvent() {
    if (!ApiService.isAuthenticated()) {
        Toast.warning('Please login first');
        window.location.href = 'login.html';
        return;
    }

    if (!confirm('Confirm your registration for this event?')) return;

    try {
        Helpers.showLoading();
        const response = await ApiService.post('/registrations', { eventId: parseInt(eventId) });

        if (response.success) {
            Toast.success('Successfully registered! 🎉');
            // Reload event details
            setTimeout(() => loadEventDetail(), 500);
        }
    } catch (error) {
        Toast.error(error.message || 'Registration failed');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Cancel registration
 */
async function cancelRegistration() {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    try {
        Helpers.showLoading();
        // Find the user's registration
        const user = ApiService.getCurrentUser();
        const userReg = currentEvent.registrations?.find(r =>
            r.user_id === user.id && r.status === 'registered'
        );

        if (!userReg) {
            Toast.error('Registration not found');
            return;
        }

        const response = await ApiService.delete(`/registrations/${userReg.id}`);

        if (response.success) {
            Toast.success('Registration cancelled');
            loadEventDetail();
        }
    } catch (error) {
        Toast.error(error.message || 'Failed to cancel');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Render attendees table (admin only)
 */
function renderAttendees(registrations) {
    const tbody = document.getElementById('attendeesTableBody');

    if (!registrations || registrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-users-slash"></i> No registrations yet
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = registrations.map(reg => `
        <tr>
            <td><strong>${Helpers.sanitizeHTML(reg.user_name || 'N/A')}</strong></td>
            <td>${reg.user_email || 'N/A'}</td>
            <td><span class="badge ${Helpers.getStatusBadgeClass(reg.status)}">${reg.status}</span></td>
            <td>${Helpers.formatDate(reg.registration_date)}</td>
        </tr>
    `).join('');
}

/**
 * Share event
 */
function shareEvent(platform) {
    const url = window.location.href;
    const title = currentEvent?.title || 'Check out this event';

    switch (platform) {
        case 'email':
            window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this event: ${url}`)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                Toast.success('Link copied to clipboard!');
            });
            break;
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
            break;
        case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
            break;
    }
}

/**
 * Show error state
 */
function showError(message) {
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('errorState').classList.remove('d-none');
    document.getElementById('errorMessage').textContent = message;
}

// Global functions
window.registerForEvent = registerForEvent;
window.cancelRegistration = cancelRegistration;
window.shareEvent = shareEvent;