/**
 * Utility Helper Functions
 * Common helper functions used across the application
 */

class Helpers {
    /**
     * Format date string to locale date
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    static formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    /**
     * Format time string to locale time
     * @param {string} timeString - Time string (HH:mm)
     * @returns {string} Formatted time
     */
    static formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Format currency
     * @param {number} amount 
     * @returns {string} Formatted currency
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    /**
     * Truncate text with ellipsis
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string} Truncated text
     */
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Get status badge class
     * @param {string} status 
     * @returns {string} CSS class
     */
    static getStatusBadgeClass(status) {
        const statusMap = {
            'active': 'badge-success',
            'inactive': 'badge-danger',
            'published': 'badge-success',
            'draft': 'badge-warning',
            'completed': 'badge-primary',
            'cancelled': 'badge-danger',
            'registered': 'badge-success',
            'attended': 'badge-primary',
            'approved': 'badge-success',
            'pending': 'badge-warning'
        };
        return statusMap[status.toLowerCase()] || 'badge-primary';
    }

    /**
     * Validate email format
     * @param {string} email 
     * @returns {boolean}
     */
    static isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password 
     * @returns {object} { valid, message }
     */
    static validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain an uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Password must contain a lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Password must contain a number' };
        }
        return { valid: true, message: 'Password is strong' };
    }

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str 
     * @returns {string} Sanitized string
     */
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Get query parameter from URL
     * @param {string} param 
     * @returns {string|null}
     */
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    /**
     * Generate random ID
     * @param {number} length 
     * @returns {string} Random ID
     */
    static generateId(length = 10) {
        return Math.random().toString(36).substring(2, length + 2);
    }

    /**
     * Debounce function
     * @param {function} func 
     * @param {number} delay 
     * @returns {function}
     */
    static debounce(func, delay = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Show loading overlay
     */
    static showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = '<div class="spinner spinner-lg"></div>';
        document.body.appendChild(overlay);
    }

    /**
     * Hide loading overlay
     */
    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Export for use in other files
window.Helpers = Helpers;