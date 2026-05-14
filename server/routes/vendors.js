const express = require('express');
const router = express.Router();
const VendorController = require('../controllers/vendorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');


// Get own vendor profile
router.get('/my-profile', authenticateToken, authorizeRoles('vendor'), VendorController.getMyProfile);
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



// Get own vendor profile
router.get('/my-profile', authenticateToken, authorizeRoles('vendor'), async (req, res, next) => {
    try {
        const [vendors] = await pool.query(
            'SELECT * FROM vendors WHERE user_id = ?',
            [req.user.id]
        );
        
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor profile not found'
            });
        }
        
        res.json({
            success: true,
            data: vendors[0]
        });
    } catch (error) {
        next(error);
    }
});

// Don't forget to require pool at top
const { pool } = require('../config/database');

// Get vendor status history (admin only)
router.get('/:id/history', authenticateToken, authorizeRoles('admin'), VendorController.getVendorHistory);

module.exports = router;