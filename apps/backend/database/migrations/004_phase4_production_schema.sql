CREATE TABLE IF NOT EXISTS production_lines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  line_code VARCHAR(50) NOT NULL,
  line_name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NULL,
  target_workers INT NOT NULL DEFAULT 0,
  maximum_workers INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
  description TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_production_lines_code (line_code),
  KEY idx_production_lines_code (line_code),
  KEY idx_production_lines_status (status),
  CONSTRAINT fk_production_lines_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_production_lines_target CHECK (target_workers >= 0),
  CONSTRAINT chk_production_lines_max CHECK (maximum_workers >= target_workers)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  date_of_birth DATE NULL,
  gender VARCHAR(20) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  address VARCHAR(255) NULL,
  hire_date DATE NULL,
  position ENUM('WORKER', 'LINE_LEADER', 'TECHNICIAN', 'QC', 'OTHER') NOT NULL DEFAULT 'WORKER',
  skill_level ENUM('BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT') NOT NULL DEFAULT 'BEGINNER',
  status ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
  user_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_code (employee_code),
  KEY idx_employees_code (employee_code),
  KEY idx_employees_user_id (user_id),
  CONSTRAINT fk_employees_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_employees_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shifts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shift_code VARCHAR(50) NOT NULL,
  shift_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shifts_code (shift_code),
  KEY idx_shifts_code (shift_code),
  CONSTRAINT fk_shifts_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  operation_code VARCHAR(50) NOT NULL,
  operation_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  standard_time_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  difficulty_level VARCHAR(50) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_operations_code (operation_code),
  KEY idx_operations_code (operation_code),
  CONSTRAINT fk_operations_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_operations_std_time CHECK (standard_time_seconds > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_operations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  operation_id BIGINT UNSIGNED NOT NULL,
  sequence_number INT UNSIGNED NOT NULL,
  standard_time_seconds INT UNSIGNED NOT NULL,
  required_skill_level ENUM('BEGINNER', 'INTERMEDIATE', 'SKILLED', 'EXPERT') NOT NULL DEFAULT 'BEGINNER',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prod_ops_product_sequence (product_id, sequence_number),
  UNIQUE KEY uq_prod_ops_product_operation (product_id, operation_id),
  KEY idx_prod_ops_product (product_id),
  KEY idx_prod_ops_operation (operation_id),
  CONSTRAINT fk_prod_ops_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_ops_operation
    FOREIGN KEY (operation_id) REFERENCES operations(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_prod_ops_seq CHECK (sequence_number > 0),
  CONSTRAINT chk_prod_ops_std_time CHECK (standard_time_seconds > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS production_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  production_order_code VARCHAR(50) NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  planned_quantity INT UNSIGNED NOT NULL,
  completed_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  rejected_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_start_date DATE NULL,
  actual_end_date DATE NULL,
  priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  status ENUM('DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_production_orders_code (production_order_code),
  KEY idx_production_orders_code (production_order_code),
  KEY idx_production_orders_order (order_id),
  KEY idx_production_orders_product (product_id),
  KEY idx_production_orders_status (status),
  CONSTRAINT fk_prod_orders_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_orders_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_orders_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_prod_orders_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_prod_orders_planned_qty CHECK (planned_quantity > 0),
  CONSTRAINT chk_prod_orders_completed_qty CHECK (completed_quantity <= planned_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS production_schedules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  production_order_id BIGINT UNSIGNED NOT NULL,
  production_line_id BIGINT UNSIGNED NOT NULL,
  shift_id BIGINT UNSIGNED NOT NULL,
  schedule_date DATE NOT NULL,
  allocated_quantity INT UNSIGNED NOT NULL,
  target_quantity INT UNSIGNED NOT NULL,
  planned_workers INT UNSIGNED NOT NULL,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  status ENUM('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prod_sched_order (production_order_id),
  KEY idx_prod_sched_date (schedule_date),
  KEY idx_prod_sched_line_shift (production_line_id, shift_id),
  CONSTRAINT fk_prod_sched_order
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_prod_sched_line
    FOREIGN KEY (production_line_id) REFERENCES production_lines(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_sched_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_sched_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_prod_sched_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_prod_sched_alloc_qty CHECK (allocated_quantity > 0),
  CONSTRAINT chk_prod_sched_target_qty CHECK (target_quantity > 0),
  CONSTRAINT chk_prod_sched_workers CHECK (planned_workers > 0),
  CONSTRAINT chk_prod_sched_dates CHECK (planned_end_date >= planned_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS production_outputs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  production_schedule_id BIGINT UNSIGNED NOT NULL,
  production_order_id BIGINT UNSIGNED NOT NULL,
  production_line_id BIGINT UNSIGNED NOT NULL,
  shift_id BIGINT UNSIGNED NOT NULL,
  output_date DATE NOT NULL,
  good_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  defect_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  rework_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  working_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  downtime_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NULL,
  recorded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prod_out_date (output_date),
  KEY idx_prod_out_line (production_line_id),
  KEY idx_prod_out_order (production_order_id),
  CONSTRAINT fk_prod_out_sched
    FOREIGN KEY (production_schedule_id) REFERENCES production_schedules(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_out_order
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_out_line
    FOREIGN KEY (production_line_id) REFERENCES production_lines(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_out_shift
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_prod_out_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

