const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Service Routes
 * Base: /api/services
 */

// Public routes
router.get('/', ServiceController.getAllServices);
router.get('/:id', ServiceController.getServiceById);

// Vendor routes
router.get('/my/list', authenticateToken, authorizeRoles('vendor'), ServiceController.getMyServices);
router.post('/', authenticateToken, authorizeRoles('vendor'), ServiceController.createService);
router.put('/:id', authenticateToken, authorizeRoles('vendor'), ServiceController.updateService);
router.delete('/:id', authenticateToken, authorizeRoles('vendor'), ServiceController.deleteService);
router.patch('/:id/toggle', authenticateToken, authorizeRoles('vendor'), ServiceController.toggleAvailability);

module.exports = router;