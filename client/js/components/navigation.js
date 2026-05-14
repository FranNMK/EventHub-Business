/**
 * Navigation Component
 * Handles navbar functionality and auth state
 */

class Navigation {
    static init() {
        this.setupMobileMenu();
        this.updateAuthState();
        this.setupLogout();
        this.handleResize();
    }

    /**
     * Mobile menu toggle with overlay
     */
    static setupMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (!navToggle || !navMenu) return;

        // Toggle menu
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu(navToggle, navMenu);
        });

        // Close menu when clicking overlay
        navMenu.addEventListener('click', (e) => {
            if (e.target === navMenu) {
                this.closeMenu(navToggle, navMenu);
            }
        });

        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                // Small delay to allow link navigation
                setTimeout(() => {
                    this.closeMenu(navToggle, navMenu);
                }, 100);
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                this.closeMenu(navToggle, navMenu);
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) &&
                !navMenu.contains(e.target) &&
                navMenu.classList.contains('active')) {
                this.closeMenu(navToggle, navMenu);
            }
        });
    }

    /**
     * Toggle mobile menu
     */
    static toggleMenu(toggle, menu) {
        const isActive = menu.classList.contains('active');

        if (isActive) {
            this.closeMenu(toggle, menu);
        } else {
            this.openMenu(toggle, menu);
        }
    }

    /**
     * Open mobile menu
     */
    static openMenu(toggle, menu) {
        toggle.classList.add('active');
        menu.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    /**
     * Close mobile menu
     */
    static closeMenu(toggle, menu) {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }

    /**
     * Handle window resize
     */
    static handleResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const navToggle = document.getElementById('navToggle');
                const navMenu = document.getElementById('navMenu');

                // Close mobile menu if resizing to desktop
                if (window.innerWidth > 767 && navMenu.classList.contains('active')) {
                    this.closeMenu(navToggle, navMenu);
                }
            }, 250);
        });
    }

    static updateAuthState() {
        const isAuth = ApiService.isAuthenticated();
        const user = ApiService.getCurrentUser();

        // For dashboard pages, handle differently
        const isDashboardPage = window.location.pathname.includes('dashboard.html');

        if (isDashboardPage) {
            // On dashboard, only show logout in top nav
            const navMenu = document.getElementById('navMenu');
            if (navMenu) {
                navMenu.innerHTML = `
                <li><a href="#" onclick="handleLogout()" style="color:#f56565;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a></li>
            `;
            }
            return;
        }

        // For other pages (home, events, vendors, login, register)
        const navLogin = document.getElementById('navLogin');
        const navRegister = document.getElementById('navRegister');
        const navDashboard = document.getElementById('navDashboard');
        const navLogout = document.getElementById('navLogout');

        if (isAuth && user) {
            if (navLogin) navLogin.style.display = 'none';
            if (navRegister) navRegister.style.display = 'none';
            if (navDashboard) {
                navDashboard.style.display = 'block';
                const link = navDashboard.querySelector('a');
                if (link) {
                    link.textContent = 'Dashboard';
                    link.href = 'dashboard.html';
                }
            }
            if (navLogout) navLogout.style.display = 'block';
        } else {
            if (navLogin) navLogin.style.display = 'block';
            if (navRegister) navRegister.style.display = 'block';
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

                if (confirm('Are you sure you want to logout?')) {
                    ApiService.clearAuth();
                    this.updateAuthState();
                    Toast.success('Logged out successfully');

                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 500);
                }
            });
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});