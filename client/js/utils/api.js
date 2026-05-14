/**
 * API Service
 * Handles all HTTP requests to the backend
 */

class ApiService {
    /**
     * Get stored token
     */
    static getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    /**
     * Get authorization headers
     */
    static getHeaders(isFormData = false) {
        const headers = {};
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Make HTTP request
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} Response data
     */
    static async request(endpoint, options = {}) {
        try {
            const url = `${CONFIG.API_URL}${endpoint}`;
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(options.body instanceof FormData),
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
                    // Attempt token refresh
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        // Retry the original request
                        return this.request(endpoint, options);
                    }
                }
                
                throw new ApiError(data.message || 'Request failed', response.status, data);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Network error. Please check your connection.', 0);
        }
    }

    /**
     * GET request
     */
    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    static async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * PUT request
     */
    static async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * PATCH request
     */
    static async patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    /**
     * DELETE request
     */
    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Upload file
     */
    static async upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Refresh JWT token
     */
    static async refreshToken() {
        try {
            const refreshToken = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) return false;

            const response = await fetch(`${CONFIG.API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
                if (data.refreshToken) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
                }
                return true;
            }
            
            // Refresh failed, clear auth
            this.clearAuth();
            return false;
        } catch (error) {
            this.clearAuth();
            return false;
        }
    }

    /**
     * Clear authentication data
     */
    static clearAuth() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Get current user from storage
     */
    static getCurrentUser() {
        const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(message, statusCode, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.data = data;
    }
}

// Export for use in other files
window.ApiService = ApiService;
window.ApiError = ApiError;