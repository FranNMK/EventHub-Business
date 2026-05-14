const express = require('express');
const router = express.Router();
const VendorController = require('../controllers/vendorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Vendor Routes
 * Base: /api/vendors
 */

// Public routes (view approved vendors)
router.get('/', VendorController.getAllVendors);
router.get('/:id', VendorController.getVendorById);

// Protected routes
router.post('/register', authenticateToken, authorizeRoles('vendor'), VendorController.registerVendor);
router.put('/:id', authenticateToken, VendorController.updateVendor);

// Admin only routes
router.patch('/:id/approve', authenticateToken, authorizeRoles('admin'), VendorController.toggleApproval);

module.exports = router;