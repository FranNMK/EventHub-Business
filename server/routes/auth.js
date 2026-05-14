const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  changePasswordValidation
} = require('../middleware/validation');

/**
 * Auth Routes
 * Base: /api/auth
 */

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, profileUpdateValidation, AuthController.updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, AuthController.changePassword);
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;