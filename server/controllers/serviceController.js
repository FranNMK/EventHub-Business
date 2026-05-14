const { pool } = require('../config/database');

/**
 * Service Controller
 * Manages vendor services with full CRUD operations
 */
class ServiceController {

  /**
   * Get all services (public - for event pages)
   * GET /api/services
   */
  static async getAllServices(req, res, next) {
    try {
      const { vendorId, serviceType, search, page = 1, limit = 10 } = req.query;
      
      let query = `
        SELECT s.*, v.company_name, v.service_type as vendor_type,
               v.is_approved as vendor_approved
        FROM services s
        JOIN vendors v ON s.vendor_id = v.id
        WHERE v.is_approved = TRUE AND s.is_available = TRUE
      `;
      const params = [];

      if (vendorId) {
        query += ' AND s.vendor_id = ?';
        params.push(vendorId);
      }
      if (serviceType) {
        query += ' AND v.service_type = ?';
        params.push(serviceType);
      }
      if (search) {
        query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY s.created_at DESC';

      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [services] = await pool.query(query, params);

      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM services s JOIN vendors v ON s.vendor_id = v.id WHERE v.is_approved = TRUE AND s.is_available = TRUE'
      );

      res.json({
        success: true,
        data: services,
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
   * Get vendor's own services
   * GET /api/services/my
   */
  static async getMyServices(req, res, next) {
    try {
      // Get vendor profile for this user
      const [vendors] = await pool.query(
        'SELECT id FROM vendors WHERE user_id = ?',
        [req.user.id]
      );

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found. Please register as a vendor first.'
        });
      }

      const vendorId = vendors[0].id;

      const [services] = await pool.query(
        'SELECT * FROM services WHERE vendor_id = ? ORDER BY created_at DESC',
        [vendorId]
      );

      res.json({
        success: true,
        data: services,
        vendorId: vendorId
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single service
   * GET /api/services/:id
   */
  static async getServiceById(req, res, next) {
    try {
      const { id } = req.params;

      const [services] = await pool.query(`
        SELECT s.*, v.company_name, v.service_type as vendor_type
        FROM services s
        JOIN vendors v ON s.vendor_id = v.id
        WHERE s.id = ?
      `, [id]);

      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: services[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new service (Vendor only)
   * POST /api/services
   */
  static async createService(req, res, next) {
    try {
      const { name, description, price, duration, isAvailable } = req.body;

      // Validate required fields
      if (!name || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Service name and price are required'
        });
      }

      // Get vendor profile
      const [vendors] = await pool.query(
        'SELECT id, is_approved FROM vendors WHERE user_id = ?',
        [req.user.id]
      );

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found. Please register as a vendor first.'
        });
      }

      if (!vendors[0].is_approved) {
        return res.status(403).json({
          success: false,
          message: 'Your vendor account is pending approval. You can add services after approval.'
        });
      }

      const vendorId = vendors[0].id;

      // Insert service
      const [result] = await pool.query(
        `INSERT INTO services (vendor_id, name, description, price, duration, is_available) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          vendorId,
          name.trim(),
          description || '',
          parseFloat(price) || 0,
          duration || null,
          isAvailable !== undefined ? isAvailable : true
        ]
      );

      const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: services[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update service
   * PUT /api/services/:id
   */
  static async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, price, duration, isAvailable } = req.body;

      // Get vendor profile
      const [vendors] = await pool.query(
        'SELECT id FROM vendors WHERE user_id = ?',
        [req.user.id]
      );

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found'
        });
      }

      const vendorId = vendors[0].id;

      // Check ownership
      const [services] = await pool.query(
        'SELECT * FROM services WHERE id = ? AND vendor_id = ?',
        [id, vendorId]
      );

      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or access denied'
        });
      }

      // Build dynamic update
      const updates = [];
      const values = [];

      if (name) { updates.push('name = ?'); values.push(name.trim()); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (price !== undefined) { updates.push('price = ?'); values.push(parseFloat(price)); }
      if (duration !== undefined) { updates.push('duration = ?'); values.push(duration); }
      if (isAvailable !== undefined) { updates.push('is_available = ?'); values.push(isAvailable); }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      values.push(id);
      await pool.query(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, values);

      const [updated] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: updated[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete service
   * DELETE /api/services/:id
   */
  static async deleteService(req, res, next) {
    try {
      const { id } = req.params;

      // Get vendor profile
      const [vendors] = await pool.query(
        'SELECT id FROM vendors WHERE user_id = ?',
        [req.user.id]
      );

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found'
        });
      }

      const vendorId = vendors[0].id;

      const [result] = await pool.query(
        'DELETE FROM services WHERE id = ? AND vendor_id = ?',
        [id, vendorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle service availability
   * PATCH /api/services/:id/toggle
   */
  static async toggleAvailability(req, res, next) {
    try {
      const { id } = req.params;

      const [vendors] = await pool.query(
        'SELECT id FROM vendors WHERE user_id = ?',
        [req.user.id]
      );

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found'
        });
      }

      const [services] = await pool.query(
        'SELECT * FROM services WHERE id = ? AND vendor_id = ?',
        [id, vendors[0].id]
      );

      if (services.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      const newStatus = !services[0].is_available;
      await pool.query('UPDATE services SET is_available = ? WHERE id = ?', [newStatus, id]);

      res.json({
        success: true,
        message: `Service ${newStatus ? 'enabled' : 'disabled'} successfully`,
        data: { is_available: newStatus }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = ServiceController;