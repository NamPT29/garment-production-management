-- Migration 005: Add employee fields to users table
-- Replaces the old employees table (removed in schema redesign)

ALTER TABLE users
  ADD COLUMN employee_code VARCHAR(50) NULL AFTER role_id,
  ADD COLUMN date_of_birth DATE NULL AFTER employee_code,
  ADD COLUMN gender ENUM('NAM', 'NU', 'KHAC') NULL AFTER date_of_birth,
  ADD COLUMN phone VARCHAR(20) NULL AFTER gender,
  ADD COLUMN address TEXT NULL AFTER phone,
  ADD COLUMN hire_date DATE NULL AFTER address,
  ADD COLUMN position ENUM('LINE_LEADER', 'WORKER', 'TECHNICIAN', 'QC') NULL AFTER hire_date,
  ADD COLUMN skill_level ENUM('BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT') NULL AFTER position,
  ADD COLUMN employee_status ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED') NULL AFTER skill_level,
  ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER employee_status,
  ADD UNIQUE KEY uq_users_employee_code (employee_code),
  ADD KEY idx_users_employee_code (employee_code),
  ADD KEY idx_users_employee_status (employee_status);
