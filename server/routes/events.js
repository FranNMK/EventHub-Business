const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Event Routes
 * Base: /api/events
 */

// Public route - anyone can view published events
router.get('/public', EventController.getPublicEvents);

// Authenticated users can view all events
router.get('/', authenticateToken, EventController.getAllEvents);
router.get('/:id', authenticateToken, EventController.getEventById);

// Only admins can create, update, delete events
router.post('/', authenticateToken, authorizeRoles('admin'), EventController.createEvent);
router.put('/:id', authenticateToken, authorizeRoles('admin'), EventController.updateEvent);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), EventController.deleteEvent);

// Quick status update (admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), EventController.updateEventStatus);

module.exports = router;