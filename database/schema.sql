-- ============================================
-- EventHub Business Platform - Database Schema
-- Database: TiDB Cloud (MySQL Compatible)
-- Version: 1.0
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS eventhub_business;
USE eventhub_business;

-- Users Table
-- Stores all user accounts (Admin, Vendor, Employee)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Full name of the user',
    email VARCHAR(150) UNIQUE NOT NULL COMMENT 'Email address (used for login)',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    role ENUM('admin', 'vendor', 'employee') NOT NULL DEFAULT 'employee' COMMENT 'User role for RBAC',
    phone VARCHAR(20) COMMENT 'Contact phone number',
    avatar_url VARCHAR(255) COMMENT 'Profile picture URL',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Account status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) COMMENT='System users with role-based access';

-- Events Table
-- Corporate events created by admins
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT 'Event title',
    description TEXT COMMENT 'Detailed event description',
    date DATE NOT NULL COMMENT 'Event date',
    time TIME COMMENT 'Event time',
    location VARCHAR(255) NOT NULL COMMENT 'Event venue/location',
    capacity INT NOT NULL DEFAULT 0 COMMENT 'Maximum number of attendees',
    available_slots INT NOT NULL DEFAULT 0 COMMENT 'Remaining available slots',
    status ENUM('draft', 'published', 'completed', 'cancelled') DEFAULT 'draft' COMMENT 'Event lifecycle status',
    image_url VARCHAR(255) COMMENT 'Event banner/image URL',
    created_by INT NOT NULL COMMENT 'Admin who created the event',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_date (date),
    INDEX idx_created_by (created_by)
) COMMENT='Corporate events managed by admins';

-- Vendors Table
-- Vendor profiles linked to user accounts
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Linked user account',
    company_name VARCHAR(150) NOT NULL COMMENT 'Vendor company name',
    service_type VARCHAR(100) NOT NULL COMMENT 'Type of service provided',
    description TEXT COMMENT 'Company description',
    contact_email VARCHAR(150) COMMENT 'Business contact email',
    contact_phone VARCHAR(20) COMMENT 'Business contact phone',
    website VARCHAR(255) COMMENT 'Company website URL',
    address VARCHAR(255) COMMENT 'Business address',
    is_approved BOOLEAN DEFAULT FALSE COMMENT 'Admin approval status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vendor_user (user_id),
    INDEX idx_approved (is_approved),
    INDEX idx_service_type (service_type)
) COMMENT='Vendor profiles and business information';

-- Services Table
-- Services offered by vendors
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL COMMENT 'Service provider vendor',
    name VARCHAR(200) NOT NULL COMMENT 'Service name',
    description TEXT COMMENT 'Service description',
    price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Service price',
    duration VARCHAR(50) COMMENT 'Service duration (e.g., "2 hours")',
    is_available BOOLEAN DEFAULT TRUE COMMENT 'Service availability status',
    image_url VARCHAR(255) COMMENT 'Service image URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor (vendor_id),
    INDEX idx_available (is_available)
) COMMENT='Services provided by vendors';

-- Registrations Table
-- Event registrations by employees
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL COMMENT 'Registered event',
    user_id INT NOT NULL COMMENT 'Registered attendee',
    status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered' COMMENT 'Registration status',
    qr_code TEXT COMMENT 'Generated QR code for check-in',
    qr_token VARCHAR(255) UNIQUE COMMENT 'Unique token for QR verification',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancellation_date TIMESTAMP NULL COMMENT 'When registration was cancelled',
    notes TEXT COMMENT 'Additional registration notes',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, user_id),
    INDEX idx_event (event_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_qr_token (qr_token)
) COMMENT='Event registrations and attendance tracking';

-- Refresh Tokens Table
-- Store refresh tokens for JWT authentication
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Token owner',
    token VARCHAR(255) NOT NULL COMMENT 'Refresh token value',
    expires_at TIMESTAMP NOT NULL COMMENT 'Token expiration',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id)
) COMMENT='JWT refresh tokens for extended sessions';

-- ============================================
-- Sample Data for Testing (Optional)
-- ============================================

-- Insert default admin user (password: Admin@123)
-- INSERT INTO users (name, email, password_hash, role) 
-- VALUES ('System Admin', 'admin@eventhub.com', '$2a$12$LJ3m4ys3GZ0YOUR_HASH_HERE', 'admin');