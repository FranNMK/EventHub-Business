const { pool } = require('../config/database');

/**
 * Vendor Controller
 * Handles vendor CRUD and management
 */
class VendorController {

  /**
   * Get all vendors (public - only approved)
   * GET /api/vendors
   */
  static async getAllVendors(req, res, next) {
    try {
      const { approved, serviceType, search, page = 1, limit = 10 } = req.query;
      
      let query = `
        SELECT v.*, u.name as contact_name, u.email as user_email
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      // Filter by approval status
      if (approved === 'true') {
        query += ' AND v.is_approved = TRUE';
      } else if (approved === 'false') {
        query += ' AND v.is_approved = FALSE';
      }

      // Filter by service type
      if (serviceType && serviceType !== 'all') {
        query += ' AND v.service_type = ?';
        params.push(serviceType);
      }

      // Search by company name
      if (search) {
        query += ' AND (v.company_name LIKE ? OR v.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // If user is not admin, only show approved vendors
      if (!req.user || req.user.role !== 'admin') {
        query += ' AND v.is_approved = TRUE';
      }

      query += ' ORDER BY v.created_at DESC';

      // Pagination
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [vendors] = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM vendors WHERE 1=1';
      const countParams = [];
      if (approved === 'true') {
        countQuery += ' AND is_approved = TRUE';
      }
      if (serviceType && serviceType !== 'all') {
        countQuery += ' AND service_type = ?';
        countParams.push(serviceType);
      }
      const [countResult] = await pool.query(countQuery, countParams);

      res.json({
        success: true,
        data: vendors,
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
   * Get single vendor
   * GET /api/vendors/:id
   */
  static async getVendorById(req, res, next) {
    try {
      const { id } = req.params;

      const [vendors] = await pool.query(`
        SELECT v.*, u.name as contact_name, u.email as user_email
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        WHERE v.id = ?
      `, [id]);

      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Get vendor services
      const [services] = await pool.query(
        'SELECT * FROM services WHERE vendor_id = ? AND is_available = TRUE',
        [id]
      );

      res.json({
        success: true,
        data: {
          ...vendors[0],
          services
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Register as vendor
   * POST /api/vendors/register
   */
  static async registerVendor(req, res, next) {
    try {
      const { companyName, serviceType, description, contactEmail, contactPhone, website, address } = req.body;

      // Check if user already has a vendor profile
      const [existing] = await pool.query(
        'SELECT id FROM vendors WHERE user_id = ?',
        [req.user.id]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You already have a vendor profile'
        });
      }

      const [result] = await pool.query(
        `INSERT INTO vendors (user_id, company_name, service_type, description, contact_email, contact_phone, website, address) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, companyName, serviceType, description || '', contactEmail, contactPhone, website, address]
      );

      const [vendors] = await pool.query('SELECT * FROM vendors WHERE id = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Vendor profile created successfully. Waiting for admin approval.',
        data: vendors[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update vendor profile
   * PUT /api/vendors/:id
   */
  static async updateVendor(req, res, next) {
    try {
      const { id } = req.params;
      const { companyName, serviceType, description, contactEmail, contactPhone, website, address } = req.body;

      // Check ownership
      const [vendors] = await pool.query(
        'SELECT * FROM vendors WHERE id = ? AND user_id = ?',
        [id, req.user.id]
      );

      if (vendors.length === 0 && req.user.role !== 'admin') {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found or access denied'
        });
      }

      const updates = [];
      const values = [];

      if (companyName) { updates.push('company_name = ?'); values.push(companyName); }
      if (serviceType) { updates.push('service_type = ?'); values.push(serviceType); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (contactEmail !== undefined) { updates.push('contact_email = ?'); values.push(contactEmail); }
      if (contactPhone !== undefined) { updates.push('contact_phone = ?'); values.push(contactPhone); }
      if (website !== undefined) { updates.push('website = ?'); values.push(website); }
      if (address !== undefined) { updates.push('address = ?'); values.push(address); }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      values.push(id);
      await pool.query(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`, values);

      const [updated] = await pool.query('SELECT * FROM vendors WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: updated[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve/Reject vendor (Admin only)
   * PATCH /api/vendors/:id/approve
   */
  static async toggleApproval(req, res, next) {
    try {
      const { id } = req.params;
      const { approved } = req.body;

      const [result] = await pool.query(
        'UPDATE vendors SET is_approved = ? WHERE id = ?',
        [approved, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      res.json({
        success: true,
        message: `Vendor ${approved ? 'approved' : 'rejected'} successfully`
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = VendorController;