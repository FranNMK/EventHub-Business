/**
 * Login Page Script
 * Handles login form submission and validation
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Real-time validation
    emailInput.addEventListener('input', () => {
        validateEmail(emailInput);
    });

    passwordInput.addEventListener('input', () => {
        validatePassword(passwordInput);
    });

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            const response = await ApiService.post('/auth/login', {
                email: emailInput.value.trim(),
                password: passwordInput.value
            });

            if (response.success) {
                // Store tokens and user data
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, response.data.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.data.user));

                // Remember me
                if (document.getElementById('rememberMe').checked) {
                    localStorage.setItem('ehb_remember', emailInput.value);
                } else {
                    localStorage.removeItem('ehb_remember');
                }

                Toast.success('Login successful! Redirecting...');
                
                // Redirect based on role
                setTimeout(() => {
                    redirectByRole(response.data.user.role);
                }, 1000);
            }
        } catch (error) {
            showError(error.message);
        } finally {
            setLoadingState(false);
        }
    });

    // Load remembered email
    const rememberedEmail = localStorage.getItem('ehb_remember');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }

    // Redirect if already logged in
    if (ApiService.isAuthenticated()) {
        const user = ApiService.getCurrentUser();
        if (user) {
            redirectByRole(user.role);
        }
    }
});

/**
 * Validate email field
 */
function validateEmail(input) {
    const errorEl = document.getElementById('emailError');
    const value = input.value.trim();

    if (!value) {
        showFieldError(input, errorEl, 'Email is required');
        return false;
    }

    if (!Helpers.isValidEmail(value)) {
        showFieldError(input, errorEl, 'Please enter a valid email address');
        return false;
    }

    clearFieldError(input, errorEl);
    return true;
}

/**
 * Validate password field
 */
function validatePassword(input) {
    const errorEl = document.getElementById('passwordError');
    const value = input.value;

    if (!value) {
        showFieldError(input, errorEl, 'Password is required');
        return false;
    }

    if (value.length < 6) {
        showFieldError(input, errorEl, 'Password must be at least 6 characters');
        return false;
    }

    clearFieldError(input, errorEl);
    return true;
}

/**
 * Show field error
 */
function showFieldError(input, errorEl, message) {
    input.classList.add('error');
    errorEl.textContent = message;
}

/**
 * Clear field error
 */
function clearFieldError(input, errorEl) {
    input.classList.remove('error');
    errorEl.textContent = '';
}

/**
 * Show form error
 */
function showError(message) {
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = message;
    errorEl.classList.remove('d-none');
    
    setTimeout(() => {
        errorEl.classList.add('d-none');
    }, 5000);
}

/**
 * Toggle loading state
 */
function setLoadingState(isLoading) {
    const btn = document.getElementById('loginBtn');
    const spinner = document.getElementById('loginSpinner');
    const btnText = btn.querySelector('.btn-text');

    if (isLoading) {
        btn.disabled = true;
        spinner.classList.remove('d-none');
        btnText.textContent = 'Signing in...';
    } else {
        btn.disabled = false;
        spinner.classList.add('d-none');
        btnText.textContent = 'Sign In';
    }
}

/**
 * Redirect based on user role
 */
function redirectByRole(role) {
    switch (role) {
        case 'admin':
            window.location.href = 'dashboard.html';
            break;
        case 'vendor':
            window.location.href = 'vendor-dashboard.html';
            break;
        case 'employee':
            window.location.href = 'events.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}