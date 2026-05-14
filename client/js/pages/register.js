/**
 * Register Page Script
 * Handles registration form with validation
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const registerBtn = document.getElementById('registerBtn');
    const registerSpinner = document.getElementById('registerSpinner');
    const registerError = document.getElementById('registerError');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Real-time validation
    nameInput.addEventListener('input', () => validateName(nameInput));
    emailInput.addEventListener('input', () => validateEmail(emailInput));
    passwordInput.addEventListener('input', () => {
        validatePassword(passwordInput);
        updatePasswordStrength(passwordInput.value);
        if (confirmPasswordInput.value) {
            validateConfirmPassword(confirmPasswordInput, passwordInput);
        }
    });
    confirmPasswordInput.addEventListener('input', () => {
        validateConfirmPassword(confirmPasswordInput, passwordInput);
    });

    // Form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        const isNameValid = validateName(nameInput);
        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);
        const isConfirmValid = validateConfirmPassword(confirmPasswordInput, passwordInput);
        const isTermsAgreed = document.getElementById('termsAgree').checked;

        if (!isTermsAgreed) {
            Toast.warning('Please agree to the Terms of Service');
            return;
        }

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            const response = await ApiService.post('/auth/register', {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
                role: document.getElementById('role').value
            });

            if (response.success) {
                // Store tokens and user data
                localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, response.data.token);
                localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.data.user));

                Toast.success('Account created successfully! Redirecting...');
                
                setTimeout(() => {
                    redirectByRole(response.data.user.role);
                }, 1000);
            } else {
                showError(response.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = error.message || 'An error occurred during registration. Please try again.';
            showError(errorMsg);
        } finally {
            setLoadingState(false);
        }
    });
});

/**
 * Validate name field
 */
function validateName(input) {
    const errorEl = document.getElementById('nameError');
    const value = input.value.trim();

    if (!value) {
        showFieldError(input, errorEl, 'Name is required');
        return false;
    }

    if (value.length < 2) {
        showFieldError(input, errorEl, 'Name must be at least 2 characters');
        return false;
    }

    clearFieldError(input, errorEl);
    return true;
}

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

    if (value.length < 8) {
        showFieldError(input, errorEl, 'Password must be at least 8 characters');
        return false;
    }

    if (!/[A-Z]/.test(value)) {
        showFieldError(input, errorEl, 'Password must contain an uppercase letter');
        return false;
    }

    if (!/[a-z]/.test(value)) {
        showFieldError(input, errorEl, 'Password must contain a lowercase letter');
        return false;
    }

    if (!/[0-9]/.test(value)) {
        showFieldError(input, errorEl, 'Password must contain a number');
        return false;
    }

    clearFieldError(input, errorEl);
    return true;
}

/**
 * Validate confirm password
 */
function validateConfirmPassword(input, passwordInput) {
    const errorEl = document.getElementById('confirmPasswordError');
    const value = input.value;

    if (!value) {
        showFieldError(input, errorEl, 'Please confirm your password');
        return false;
    }

    if (value !== passwordInput.value) {
        showFieldError(input, errorEl, 'Passwords do not match');
        return false;
    }

    clearFieldError(input, errorEl);
    return true;
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    strengthBar.classList.remove('weak', 'medium', 'strong');
    
    if (password.length === 0) {
        strengthText.textContent = '';
        strengthText.style.color = '';
    } else if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = 'var(--danger)';
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Medium';
        strengthText.style.color = 'var(--warning)';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = 'var(--success)';
    }
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
    const errorEl = document.getElementById('registerError');
    errorEl.textContent = message;
    errorEl.classList.remove('d-none');
    console.error('Registration form error:', message);
    
    // Keep error visible for 8 seconds
    setTimeout(() => {
        errorEl.classList.add('d-none');
    }, 8000);
}

/**
 * Toggle loading state
 */
function setLoadingState(isLoading) {
    const btn = document.getElementById('registerBtn');
    const spinner = document.getElementById('registerSpinner');
    const btnText = btn.querySelector('.btn-text');

    if (isLoading) {
        btn.disabled = true;
        spinner.classList.remove('d-none');
        btnText.textContent = 'Creating Account...';
    } else {
        btn.disabled = false;
        spinner.classList.add('d-none');
        btnText.textContent = 'Create Account';
    }
}

/**
 * Redirect based on role
 */
function redirectByRole(role) {
    switch (role) {
        case 'admin':
            window.location.href = 'dashboard.html';
            break;
        case 'vendor':
            window.location.href = 'dashboard.html';
            break;
        case 'employee':
            window.location.href = 'events.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}