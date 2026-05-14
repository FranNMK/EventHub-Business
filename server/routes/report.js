const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Report Routes
 * Base: /api/reports
 */

// Admin only routes
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), ReportController.getDashboardSummary);
router.get('/events/:eventId/export', authenticateToken, authorizeRoles('admin'), ReportController.exportEventRegistrations);

module.exports = router;