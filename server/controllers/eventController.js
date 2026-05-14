const { pool } = require('../config/database');

/**
 * Event Controller
 * Handles all event CRUD operations
 */
class EventController {

  /**
   * Get all events with optional filters
   * GET /api/events
   */
  static async getAllEvents(req, res, next) {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      
      let query = `
        SELECT e.*, u.name as creator_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status != 'cancelled') as registration_count
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      // Filter by status
      if (status && status !== 'all') {
        query += ' AND e.status = ?';
        params.push(status);
      }

      // Search by title or location
      if (search) {
        query += ' AND (e.title LIKE ? OR e.location LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Role-based filtering
      if (req.user.role === 'employee') {
        // Employees see only published events
        query += ' AND e.status = ?';
        params.push('published');
      } else if (req.user.role === 'vendor') {
        // Vendors see published events
        query += ' AND e.status = ?';
        params.push('published');
      }
      // Admins see all their events

      // Sort by date
      query += ' ORDER BY e.date DESC';

      // Pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [events] = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM events WHERE 1=1';
      const countParams = [];
      
      if (status && status !== 'all') {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      if (search) {
        countQuery += ' AND (title LIKE ? OR location LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }
      if (req.user.role === 'employee' || req.user.role === 'vendor') {
        countQuery += ' AND status = ?';
        countParams.push('published');
      }

      const [countResult] = await pool.query(countQuery, countParams);

      res.json({
        success: true,
        data: events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single event by ID
   * GET /api/events/:id
   */
  static async getEventById(req, res, next) {
    try {
      const { id } = req.params;

      const [events] = await pool.query(`
        SELECT e.*, u.name as creator_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status != 'cancelled') as registration_count
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = ?
      `, [id]);

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Get registered users for this event (admin only)
      let registrations = [];
      if (req.user.role === 'admin') {
        const [regs] = await pool.query(`
          SELECT r.*, u.name as user_name, u.email as user_email
          FROM registrations r
          JOIN users u ON r.user_id = u.id
          WHERE r.event_id = ?
          ORDER BY r.registration_date DESC
        `, [id]);
        registrations = regs;
      }

      res.json({
        success: true,
        data: {
          ...events[0],
          registrations: registrations
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new event
   * POST /api/events
   */
  static async createEvent(req, res, next) {
    try {
      const { title, description, date, time, location, capacity, status } = req.body;

      // Validate required fields
      if (!title || !date || !location || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'Please provide title, date, location, and capacity'
        });
      }

      // Validate date is not in the past
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Event date cannot be in the past'
        });
      }

      const [result] = await pool.query(
        `INSERT INTO events (title, description, date, time, location, capacity, available_slots, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          description || '',
          date,
          time || null,
          location.trim(),
          parseInt(capacity),
          parseInt(capacity), // Initially available slots = capacity
          status || 'draft',
          req.user.id
        ]
      );

      // Fetch the created event
      const [events] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: events[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   * PUT /api/events/:id
   */
  static async updateEvent(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, date, time, location, capacity, status } = req.body;

      // Check if event exists and user owns it
      const [events] = await pool.query('SELECT * FROM events WHERE id = ? AND created_by = ?', [id, req.user.id]);

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or you do not have permission to edit it'
        });
      }

      const event = events[0];

      // If changing capacity, adjust available slots
      let availableSlots = event.available_slots;
      if (capacity && parseInt(capacity) !== event.capacity) {
        const difference = parseInt(capacity) - event.capacity;
        availableSlots = Math.max(0, event.available_slots + difference);
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (title) {
        updates.push('title = ?');
        values.push(title.trim());
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (date) {
        updates.push('date = ?');
        values.push(date);
      }
      if (time !== undefined) {
        updates.push('time = ?');
        values.push(time);
      }
      if (location) {
        updates.push('location = ?');
        values.push(location.trim());
      }
      if (capacity) {
        updates.push('capacity = ?');
        values.push(parseInt(capacity));
        updates.push('available_slots = ?');
        values.push(availableSlots);
      }
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      values.push(id);

      await pool.query(
        `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Fetch updated event
      const [updatedEvents] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: updatedEvents[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   * DELETE /api/events/:id
   */
  static async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;

      // Check if event exists and user owns it
      const [events] = await pool.query('SELECT * FROM events WHERE id = ? AND created_by = ?', [id, req.user.id]);

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or you do not have permission to delete it'
        });
      }

      // Check if there are active registrations
      const [registrations] = await pool.query(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'registered'",
        [id]
      );

      if (registrations[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete event with ${registrations[0].count} active registrations. Cancel all registrations first.`
        });
      }

      await pool.query('DELETE FROM events WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event status only
   * PATCH /api/events/:id/status
   */
  static async updateEventStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['draft', 'published', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const [result] = await pool.query(
        'UPDATE events SET status = ? WHERE id = ? AND created_by = ?',
        [status, id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or you do not have permission'
        });
      }

      res.json({
        success: true,
        message: `Event status updated to ${status}`
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = EventController;