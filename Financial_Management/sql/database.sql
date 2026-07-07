-- ============================================
-- Auth System Database Schema
-- Import this in phpMyAdmin (XAMPP) or run:
--   mysql -u root -p < database.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS financial_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE financial_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'user') NOT NULL DEFAULT 'user',
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- OTP codes table (used for both registration verification and password reset)
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose ENUM('register', 'reset') NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    attempts INT NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose)
) ENGINE=InnoDB;

-- ============================================
-- Already have this database from before and just need the role column?
-- Run this instead of the CREATE TABLE above:
--   ALTER TABLE users ADD COLUMN role ENUM('admin','staff','user') NOT NULL DEFAULT 'user' AFTER password_hash;
--
-- All public registrations default to 'user'. To promote someone to staff
-- or admin, run one of these in phpMyAdmin's SQL tab:
--   UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
--   UPDATE users SET role = 'staff' WHERE email = 'someone@example.com';
-- ============================================
