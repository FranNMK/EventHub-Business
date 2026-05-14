const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
require('dotenv').config();

/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */
class AuthController {
  
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      // Hash password (12 rounds)
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert user
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email.toLowerCase(), passwordHash, role || 'employee']
      );

      // Generate tokens
      const user = {
        id: result.insertId,
        name,
        email: email.toLowerCase(),
        role: role || 'employee'
      };

      const token = AuthController.generateToken(user);
      const refreshToken = AuthController.generateRefreshToken(user);

      // Store refresh token
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [user.id, refreshToken]
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token,
          refreshToken
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const [users] = await pool.query(
        'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = users[0];

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Contact administrator.'
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      const token = AuthController.generateToken(tokenPayload);
      const refreshToken = AuthController.generateRefreshToken(tokenPayload);

      // Store refresh token
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [user.id, refreshToken]
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token,
          refreshToken
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh JWT token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify token exists in database
      const [tokens] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [refreshToken]
      );

      if (tokens.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Verify JWT
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Generate new tokens
        const tokenPayload = {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        };

        const newToken = AuthController.generateToken(tokenPayload);
        const newRefreshToken = AuthController.generateRefreshToken(tokenPayload);

        // Update refresh token in database
        await pool.query(
          'UPDATE refresh_tokens SET token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id = ?',
          [newRefreshToken, tokens[0].id]
        );

        res.json({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            token: newToken,
            refreshToken: newRefreshToken
          }
        });

      } catch (jwtError) {
        // Delete invalid token
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  static async getProfile(req, res, next) {
    try {
      const [users] = await pool.query(
        'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: users[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      const userId = req.user.id;

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      values.push(userId);

      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Get updated user
      const [users] = await pool.query(
        'SELECT id, name, email, role, phone, avatar_url FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: users[0]
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get current password hash
      const [users] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, userId]
      );

      // Invalidate all refresh tokens for security
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate JWT token (short-lived)
   * @param {object} user 
   * @returns {string} JWT token
   */
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
  }

  /**
   * Generate refresh token (long-lived)
   * @param {object} user 
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
  }
}

module.exports = AuthController;