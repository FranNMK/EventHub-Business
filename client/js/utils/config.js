/**
 * Application Configuration
 * Central config file for API endpoints and app settings
 */
const CONFIG = {
    // API Configuration
    API_URL: 'http://localhost:5000/api',
    
    // Application Settings
    APP_NAME: 'EventHub Business',
    APP_VERSION: '1.0.0',
    
    // Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'ehb_token',
        REFRESH_TOKEN: 'ehb_refresh_token',
        USER: 'ehb_user'
    },
    
    // Routes
    ROUTES: {
        HOME: '/',
        LOGIN: '/pages/login.html',
        REGISTER: '/pages/register.html',
        DASHBOARD: '/pages/dashboard.html',
        EVENTS: '/pages/events.html',
        VENDORS: '/pages/vendors.html'
    },
    
    // Toast Duration (ms)
    TOAST_DURATION: 3000,
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10
};

// Prevent modifications to config
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.ROUTES);