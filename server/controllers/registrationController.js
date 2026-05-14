const { pool } = require('../config/database');
const crypto = require('crypto');

/**
 * Registration Controller
 * Handles event registrations
 */
class RegistrationController {

  /**
   * Get user's registrations
   * GET /api/registrations
   */
  static async getUserRegistrations(req, res, next) {
    try {
      const [registrations] = await pool.query(`
        SELECT r.*, e.title as event_title, e.date as event_date, e.time as event_time,
               e.location as event_location, e.status as event_status
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = ?
        ORDER BY r.registration_date DESC
      `, [req.user.id]);

      res.json({
        success: true,
        data: registrations
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Register for an event
   * POST /api/registrations
   */
  static async registerForEvent(req, res, next) {
    try {
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }

      // Check if event exists and is published
      const [events] = await pool.query(
        'SELECT * FROM events WHERE id = ? AND status = ?',
        [eventId, 'published']
      );

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or not available for registration'
        });
      }

      const event = events[0];

      // Check event date hasn't passed
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot register for past events'
        });
      }

      // Check if already registered (include cancelled to allow re-registration)
      const [existing] = await pool.query(
        "SELECT * FROM registrations WHERE event_id = ? AND user_id = ? AND status = 'registered'",
        [eventId, req.user.id]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You are already registered for this event'
        });
      }

      // Check if previously cancelled - allow re-registration
      const [cancelled] = await pool.query(
        "SELECT * FROM registrations WHERE event_id = ? AND user_id = ? AND status = 'cancelled'",
        [eventId, req.user.id]
      );

      if (cancelled.length > 0) {
        // Reactivate the cancelled registration
        await pool.query(
          "UPDATE registrations SET status = 'registered', cancellation_date = NULL, registration_date = NOW() WHERE id = ?",
          [cancelled[0].id]
        );

        // Update available slots
        await pool.query(
          'UPDATE events SET available_slots = available_slots - 1 WHERE id = ? AND available_slots > 0',
          [eventId]
        );

        const [registrations] = await pool.query(`
        SELECT r.*, e.title as event_title, e.date as event_date
        FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.id = ?
    `, [cancelled[0].id]);

        return res.status(200).json({
          success: true,
          message: 'Successfully re-registered for the event',
          data: registrations[0]
        });
      }
      // Check capacity
      if (event.available_slots <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Event is fully booked'
        });
      }

      // Generate QR token
      const qrToken = crypto.randomBytes(32).toString('hex');

      // Create registration
      const [result] = await pool.query(
        `INSERT INTO registrations (event_id, user_id, status, qr_token) VALUES (?, ?, 'registered', ?)`,
        [eventId, req.user.id, qrToken]
      );

      // Update available slots
      await pool.query(
        'UPDATE events SET available_slots = available_slots - 1 WHERE id = ? AND available_slots > 0',
        [eventId]
      );

      // Fetch the registration
      const [registrations] = await pool.query(`
        SELECT r.*, e.title as event_title, e.date as event_date
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.id = ?
      `, [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Successfully registered for the event',
        data: registrations[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel registration
   * DELETE /api/registrations/:id
   */
  static async cancelRegistration(req, res, next) {
    try {
      const { id } = req.params;

      // Check if registration exists and belongs to user
      const [registrations] = await pool.query(
        'SELECT * FROM registrations WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (registrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      const registration = registrations[0];

      if (registration.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Registration is already cancelled'
        });
      }

      // Cancel registration
      await pool.query(
        "UPDATE registrations SET status = 'cancelled', cancellation_date = NOW() WHERE id = ?",
        [id]
      );

      // Restore available slot
      await pool.query(
        'UPDATE events SET available_slots = available_slots + 1 WHERE id = ?',
        [registration.event_id]
      );

      res.json({
        success: true,
        message: 'Registration cancelled successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all registrations for an event (admin only)
   * GET /api/registrations/event/:eventId
   */
  static async getEventRegistrations(req, res, next) {
    try {
      const { eventId } = req.params;

      const [registrations] = await pool.query(`
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ?
        ORDER BY r.registration_date DESC
      `, [eventId]);

      res.json({
        success: true,
        data: registrations
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = RegistrationController;