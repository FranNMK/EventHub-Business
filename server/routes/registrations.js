const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/registrationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Registration Routes
 * Base: /api/registrations
 */

// User routes
router.get('/', authenticateToken, RegistrationController.getUserRegistrations);
router.post('/', authenticateToken, authorizeRoles('employee', 'vendor'), RegistrationController.registerForEvent);
router.delete('/:id', authenticateToken, RegistrationController.cancelRegistration);

// Admin routes
router.get('/event/:eventId', authenticateToken, authorizeRoles('admin'), RegistrationController.getEventRegistrations);

module.exports = router;