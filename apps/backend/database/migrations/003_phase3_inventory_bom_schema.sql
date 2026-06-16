CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_code VARCHAR(50) NOT NULL,
  supplier_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  address VARCHAR(255) NULL,
  tax_code VARCHAR(50) NULL,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_code (supplier_code),
  KEY idx_suppliers_code (supplier_code),
  CONSTRAINT fk_suppliers_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  material_code VARCHAR(50) NOT NULL,
  material_name VARCHAR(150) NOT NULL,
  category ENUM('FABRIC', 'THREAD', 'BUTTON', 'ZIPPER', 'LABEL', 'PACKAGING', 'ACCESSORY', 'OTHER') NOT NULL,
  unit VARCHAR(30) NOT NULL,
  color VARCHAR(80) NULL,
  specification VARCHAR(255) NULL,
  minimum_stock DECIMAL(15, 4) NOT NULL DEFAULT 0,
  default_supplier_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_materials_code (material_code),
  KEY idx_materials_code (material_code),
  CONSTRAINT fk_materials_supplier
    FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_materials_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_materials_min_stock CHECK (minimum_stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warehouses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  warehouse_code VARCHAR(50) NOT NULL,
  warehouse_name VARCHAR(150) NOT NULL,
  location VARCHAR(255) NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warehouses_code (warehouse_code),
  KEY idx_warehouses_code (warehouse_code),
  CONSTRAINT fk_warehouses_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS boms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  version VARCHAR(50) NOT NULL,
  status ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
  effective_date DATE NOT NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_boms_product_version (product_id, version),
  KEY idx_boms_product_id (product_id),
  KEY idx_boms_status (status),
  CONSTRAINT fk_boms_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_boms_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_boms_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bom_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bom_id BIGINT UNSIGNED NOT NULL,
  material_id BIGINT UNSIGNED NOT NULL,
  quantity_per_unit DECIMAL(15, 4) NOT NULL,
  waste_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bom_items_bom_material (bom_id, material_id),
  CONSTRAINT fk_bom_items_bom
    FOREIGN KEY (bom_id) REFERENCES boms(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bom_items_material
    FOREIGN KEY (material_id) REFERENCES materials(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_bom_items_qty CHECK (quantity_per_unit > 0),
  CONSTRAINT chk_bom_items_waste CHECK (waste_rate_percent >= 0 AND waste_rate_percent <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_balances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  material_id BIGINT UNSIGNED NOT NULL,
  quantity_on_hand DECIMAL(15, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_balances_warehouse_material (warehouse_id, material_id),
  KEY idx_inventory_balances_warehouse_material (warehouse_id, material_id),
  CONSTRAINT fk_inventory_balances_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_balances_material
    FOREIGN KEY (material_id) REFERENCES materials(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_inventory_balances_qty CHECK (quantity_on_hand >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_code VARCHAR(50) NOT NULL,
  transaction_type ENUM('RECEIPT', 'ISSUE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT') NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  transaction_date DATE NOT NULL,
  reference_number VARCHAR(100) NULL,
  notes TEXT NULL,
  status ENUM('DRAFT', 'POSTED') NOT NULL DEFAULT 'DRAFT',
  created_by BIGINT UNSIGNED NULL,
  posted_by BIGINT UNSIGNED NULL,
  posted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_transactions_code (transaction_code),
  KEY idx_inventory_transactions_code (transaction_code),
  KEY idx_inventory_transactions_type (transaction_type),
  KEY idx_inventory_transactions_date (transaction_date),
  KEY idx_inventory_transactions_supplier (supplier_id),
  KEY idx_inventory_transactions_order (order_id),
  CONSTRAINT fk_inventory_transactions_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_transactions_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_transactions_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_transactions_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_transactions_posted_by
    FOREIGN KEY (posted_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transaction_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inventory_transaction_id BIGINT UNSIGNED NOT NULL,
  material_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  unit_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inv_transaction_items_tx_material (inventory_transaction_id, material_id),
  CONSTRAINT fk_inventory_transaction_items_tx
    FOREIGN KEY (inventory_transaction_id) REFERENCES inventory_transactions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_transaction_items_material
    FOREIGN KEY (material_id) REFERENCES materials(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_inventory_transaction_items_qty CHECK (quantity > 0),
  CONSTRAINT chk_inventory_transaction_items_cost CHECK (unit_cost >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
