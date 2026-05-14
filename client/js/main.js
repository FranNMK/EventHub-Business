/**
 * Main Application Script
 * Entry point for the EventHub Business Platform
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('EventHub Business Platform initialized');
    
    // Load dashboard stats if on home page
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('EventHub-Business/')) {
        loadHomePageStats();
    }
});

/**
 * Load statistics for home page
 */
async function loadHomePageStats() {
    try {
        // Attempt to fetch public stats
        const response = await fetch(`${CONFIG.API_URL}/health`);
        const data = await response.json();
        
        if (data.success) {
            // Animate stat numbers
            animateStats();
        }
    } catch (error) {
        console.log('Could not load stats, using defaults');
        // Set default values
        document.getElementById('totalEvents').textContent = '100+';
        document.getElementById('totalVendors').textContent = '50+';
        document.getElementById('totalRegistrations').textContent = '1000+';
    }
}

/**
 * Animate stat numbers
 */
function animateStats() {
    const stats = [
        { id: 'totalEvents', value: 100 },
        { id: 'totalVendors', value: 50 },
        { id: 'totalRegistrations', value: 1000 }
    ];
    
    stats.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (element) {
            animateValue(element, 0, stat.value, 1500);
        }
    });
}

/**
 * Animate a value from start to end
 */
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        element.textContent = current + '+';
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Handle online/offline status
window.addEventListener('online', () => {
    Toast.success('Back online!');
});

window.addEventListener('offline', () => {
    Toast.warning('You are offline. Some features may not work.');
});