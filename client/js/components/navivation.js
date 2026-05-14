/**
 * Navigation Component
 * Handles navbar functionality and auth state
 */

class Navigation {
    static init() {
        this.setupMobileMenu();
        this.updateAuthState();
        this.setupLogout();
    }

    /**
     * Mobile menu toggle
     */
    static setupMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking a link
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    /**
     * Update navigation based on auth state
     */
    static updateAuthState() {
        const isAuth = ApiService.isAuthenticated();
        const user = ApiService.getCurrentUser();

        const navLogin = document.getElementById('navLogin');
        const navRegister = document.getElementById('navRegister');
        const navDashboard = document.getElementById('navDashboard');
        const navLogout = document.getElementById('navLogout');

        if (isAuth && user) {
            // Hide login/register
            if (navLogin) navLogin.style.display = 'none';
            if (navRegister) navRegister.style.display = 'none';
            
            // Show dashboard and logout
            if (navDashboard) {
                navDashboard.style.display = 'block';
                const link = navDashboard.querySelector('a');
                if (link) {
                    link.textContent = `${user.role === 'admin' ? 'Admin' : 'My'} Dashboard`;
                }
            }
            if (navLogout) navLogout.style.display = 'block';
        } else {
            // Show login/register
            if (navLogin) navLogin.style.display = 'block';
            if (navRegister) navRegister.style.display = 'block';
            
            // Hide dashboard and logout
            if (navDashboard) navDashboard.style.display = 'none';
            if (navLogout) navLogout.style.display = 'none';
        }
    }

    /**
     * Setup logout functionality
     */
    static setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                ApiService.clearAuth();
                Toast.success('Logged out successfully');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 500);
            });
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});