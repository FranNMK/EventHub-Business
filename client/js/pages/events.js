/**
 * Events Page Script
 * Displays all available events with search and filter
 */

let currentPage = 1;
let totalPages = 1;
let selectedEvent = null;

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupEventListeners();
});

function setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('eventSearch');
    searchInput?.addEventListener('input', Helpers.debounce(() => {
        currentPage = 1;
        loadEvents();
    }, 500));

    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', () => {
        currentPage = 1;
        loadEvents();
    });

    // Close detail modal
    document.getElementById('closeDetailModal')?.addEventListener('click', closeDetailModal);
    document.getElementById('eventDetailModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetailModal();
    });

    // Register button in modal
    document.getElementById('registerEventBtn')?.addEventListener('click', registerForEvent);
}

/**
 * Load events from API
 */
async function loadEvents() {
    try {
        const search = document.getElementById('eventSearch')?.value || '';
        const status = document.getElementById('statusFilter')?.value || 'all';
        
        let endpoint = `/events?page=${currentPage}&limit=9`;
        if (status !== 'all') endpoint += `&status=${status}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;

        const response = await ApiService.get(endpoint);
        
        if (response.success) {
            renderEvents(response.data);
            totalPages = response.pagination?.pages || 1;
            renderPagination();
        }
    } catch (error) {
        console.error('Failed to load events:', error);
        // If not authenticated, show login prompt
        if (error.statusCode === 401) {
            document.getElementById('eventsGrid').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock"></i>
                    <h3>Please Login</h3>
                    <p>You need to login to view events.</p>
                    <a href="login.html" class="btn btn-primary">Login</a>
                </div>
            `;
        }
    }
}

/**
 * Render events grid
 */
function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!events || events.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');

    grid.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-card-image">
                <i class="fas fa-calendar-alt"></i>
                <span class="event-status-badge">
                    <span class="badge ${Helpers.getStatusBadgeClass(event.status)}">${event.status}</span>
                </span>
            </div>
            <div class="event-card-body">
                <h3 class="event-card-title">${Helpers.sanitizeHTML(event.title)}</h3>
                <p class="event-card-description">${Helpers.sanitizeHTML(event.description || 'No description available.')}</p>
                
                <div class="event-card-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${Helpers.formatDate(event.date)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${event.time ? Helpers.formatTime(event.time) : 'TBD'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${Helpers.truncateText(event.location, 25)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${event.available_slots}/${event.capacity} slots</span>
                    </div>
                </div>
                
                <div class="event-card-footer">
                    <button class="btn btn-outline btn-sm" onclick="showEventDetail(${event.id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    ${event.status === 'published' && ApiService.isAuthenticated() ? `
                        <button class="btn btn-primary btn-sm" onclick="quickRegister(${event.id})">
                            <i class="fas fa-ticket-alt"></i> Register
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Show event detail modal
 */
async function showEventDetail(eventId) {
    try {
        Helpers.showLoading();
        const response = await ApiService.get(`/events/${eventId}`);
        
        if (response.success) {
            selectedEvent = response.data;
            
            document.getElementById('detailEventTitle').textContent = selectedEvent.title;
            document.getElementById('detailDate').textContent = Helpers.formatDate(selectedEvent.date);
            document.getElementById('detailTime').textContent = selectedEvent.time ? Helpers.formatTime(selectedEvent.time) : 'TBD';
            document.getElementById('detailLocation').textContent = selectedEvent.location;
            document.getElementById('detailCapacity').textContent = `${selectedEvent.available_slots} / ${selectedEvent.capacity} slots available`;
            document.getElementById('detailDescription').textContent = selectedEvent.description || 'No description available.';
            document.getElementById('detailStatus').textContent = selectedEvent.status;
            document.getElementById('detailStatus').className = `badge ${Helpers.getStatusBadgeClass(selectedEvent.status)}`;
            
            const slotsEl = document.getElementById('detailSlots');
            if (selectedEvent.available_slots <= 0) {
                slotsEl.innerHTML = '<span class="text-danger">Fully Booked</span>';
                document.getElementById('registerEventBtn').disabled = true;
            } else {
                slotsEl.textContent = `${selectedEvent.available_slots} slots remaining`;
                document.getElementById('registerEventBtn').disabled = false;
            }
            
            // Hide register button if not published
            const registerBtn = document.getElementById('registerEventBtn');
            if (selectedEvent.status !== 'published' || !ApiService.isAuthenticated()) {
                registerBtn.style.display = 'none';
            } else {
                registerBtn.style.display = 'block';
            }
            
            document.getElementById('eventDetailModal').classList.remove('d-none');
        }
    } catch (error) {
        Toast.error('Failed to load event details');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Close detail modal
 */
function closeDetailModal() {
    document.getElementById('eventDetailModal').classList.add('d-none');
    selectedEvent = null;
}

/**
 * Quick register for event
 */
async function quickRegister(eventId) {
    if (!ApiService.isAuthenticated()) {
        Toast.warning('Please login to register');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    try {
        Helpers.showLoading();
        const response = await ApiService.post('/registrations', { eventId });
        
        if (response.success) {
            Toast.success('Successfully registered!');
            loadEvents(); // Refresh events list
        }
    } catch (error) {
        Toast.error(error.message || 'Registration failed');
    } finally {
        Helpers.hideLoading();
    }
}

/**
 * Register from detail modal
 */
async function registerForEvent() {
    if (selectedEvent) {
        await quickRegister(selectedEvent.id);
        closeDetailModal();
    }
}

/**
 * Render pagination
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="pagination-info">...</span>';
        }
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    pagination.innerHTML = html;
}

/**
 * Go to specific page
 */
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('eventSearch').value = '';
    document.getElementById('statusFilter').value = 'all';
    currentPage = 1;
    loadEvents();
}

// Global functions
window.showEventDetail = showEventDetail;
window.quickRegister = quickRegister;
window.goToPage = goToPage;
window.resetFilters = resetFilters;