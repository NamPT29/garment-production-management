import bcrypt from 'bcrypt';
import { env } from '../src/config/env.js';
import { pool, query, transaction } from '../src/config/database.js';

const roles = [
  ['ADMIN', 'Quan tri vien'],
  ['OWNER', 'Chu xuong / Ban giam doc'],
  ['PRODUCTION_MANAGER', 'Quan ly san xuat'],
  ['HR', 'Nhan su'],
  ['LINE_LEADER', 'To truong chuyen'],
  ['QC', 'Nhan vien QC/KCS'],
  ['WAREHOUSE', 'Nhan vien kho'],
  ['TECHNICIAN', 'Nhan vien ky thuat'],
  ['ACCOUNTING_ERP', 'Ke toan / ERP'],
];

const permissions = [
  ['USER_CREATE', 'Tao nguoi dung'],
  ['USER_UPDATE', 'Cap nhat nguoi dung'],
  ['USER_LOCK', 'Khoa tai khoan'],
  ['ROLE_MANAGE', 'Quan ly vai tro'],
  ['ORDER_VIEW', 'Xem don hang'],
  ['ORDER_CREATE', 'Tao don hang'],
  ['ORDER_UPDATE', 'Cap nhat don hang'],
  ['PLAN_CREATE', 'Tao ke hoach'],
  ['PLAN_APPROVE', 'Phe duyet ke hoach'],
  ['OUTPUT_UPDATE', 'Cap nhat san luong'],
  ['INVENTORY_IMPORT', 'Nhap kho'],
  ['INVENTORY_EXPORT', 'Xuat kho'],
  ['QUALITY_INSPECT', 'Kiem tra chat luong'],
  ['EQUIPMENT_UPDATE', 'Cap nhat thiet bi'],
  ['REPORT_EXPORT', 'Xuat bao cao'],
  ['AI_VIEW', 'Xem AI'],
  ['AI_APPROVE', 'Phe duyet AI'],
  ['CUSTOMER_VIEW', 'Xem khach hang'],
  ['CUSTOMER_CREATE', 'Tao khach hang'],
  ['CUSTOMER_UPDATE', 'Cap nhat khach hang'],
  ['CUSTOMER_DEACTIVATE', 'Ngung hoat dong khach hang'],
  ['PRODUCT_VIEW', 'Xem san pham'],
  ['PRODUCT_CREATE', 'Tao san pham'],
  ['PRODUCT_UPDATE', 'Cap nhat san pham'],
  ['PRODUCT_DEACTIVATE', 'Ngung hoat dong san pham'],
  ['ORDER_STATUS_UPDATE', 'Cap nhat trang thai don hang'],
  ['ORDER_CANCEL', 'Huy don hang'],

  // Phase 3 Permissions
  ['SUPPLIER_VIEW', 'Xem nha cung cap'],
  ['SUPPLIER_CREATE', 'Tao nha cung cap'],
  ['SUPPLIER_UPDATE', 'Cap nhat nha cung cap'],
  ['SUPPLIER_DEACTIVATE', 'Ngung hoat dong nha cung cap'],
  ['MATERIAL_VIEW', 'Xem nguyen phu lieu'],
  ['MATERIAL_CREATE', 'Tao nguyen phu lieu'],
  ['MATERIAL_UPDATE', 'Cap nhat nguyen phu lieu'],
  ['MATERIAL_DEACTIVATE', 'Ngung hoat dong nguyen phu lieu'],
  ['WAREHOUSE_VIEW', 'Xem kho hang'],
  ['WAREHOUSE_CREATE', 'Tao kho hang'],
  ['WAREHOUSE_UPDATE', 'Cap nhat kho hang'],
  ['WAREHOUSE_DEACTIVATE', 'Ngung hoat dong kho hang'],
  ['BOM_VIEW', 'Xem BOM san pham'],
  ['BOM_CREATE', 'Tao BOM san pham'],
  ['BOM_UPDATE', 'Cap nhat BOM san pham'],
  ['BOM_ACTIVATE', 'Kich hoat BOM san pham'],
  ['BOM_DEACTIVATE', 'Ngung hoat dong BOM san pham'],
  ['INVENTORY_VIEW', 'Xem ton kho hien tai'],
  ['INVENTORY_RECEIPT', 'Nhap kho nguyen phu lieu'],
  ['INVENTORY_ISSUE', 'Xuat kho nguyen phu lieu'],
  ['INVENTORY_ADJUST', 'Dieu chinh ton kho'],
  ['INVENTORY_TRANSACTION_VIEW', 'Xem lich su giao dich kho'],
  ['MATERIAL_REQUIREMENT_VIEW', 'Xem nhu cau vat tu'],
];

const rolePermissionMap = {
  OWNER: [
    'CUSTOMER_VIEW',
    'PRODUCT_VIEW',
    'ORDER_VIEW',
    'SUPPLIER_VIEW',
    'MATERIAL_VIEW',
    'WAREHOUSE_VIEW',
    'BOM_VIEW',
    'INVENTORY_VIEW',
    'INVENTORY_TRANSACTION_VIEW',
    'MATERIAL_REQUIREMENT_VIEW',
  ],
  PRODUCTION_MANAGER: [
    'CUSTOMER_VIEW',
    'CUSTOMER_CREATE',
    'CUSTOMER_UPDATE',
    'PRODUCT_VIEW',
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'ORDER_VIEW',
    'ORDER_CREATE',
    'ORDER_UPDATE',
    'ORDER_STATUS_UPDATE',
    'ORDER_CANCEL',
    'MATERIAL_VIEW',
    'WAREHOUSE_VIEW',
    'BOM_VIEW',
    'BOM_CREATE',
    'BOM_UPDATE',
    'BOM_ACTIVATE',
    'BOM_DEACTIVATE',
    'INVENTORY_VIEW',
    'INVENTORY_TRANSACTION_VIEW',
    'MATERIAL_REQUIREMENT_VIEW',
  ],
  WAREHOUSE: [
    'CUSTOMER_VIEW',
    'SUPPLIER_VIEW',
    'SUPPLIER_CREATE',
    'SUPPLIER_UPDATE',
    'MATERIAL_VIEW',
    'MATERIAL_CREATE',
    'MATERIAL_UPDATE',
    'WAREHOUSE_VIEW',
    'INVENTORY_VIEW',
    'INVENTORY_RECEIPT',
    'INVENTORY_ISSUE',
    'INVENTORY_ADJUST',
    'INVENTORY_TRANSACTION_VIEW',
    'MATERIAL_REQUIREMENT_VIEW',
    'PRODUCT_VIEW',
    'ORDER_VIEW',
  ],
  TECHNICIAN: [
    'MATERIAL_VIEW',
    'BOM_VIEW',
    'BOM_CREATE',
    'BOM_UPDATE',
    'BOM_ACTIVATE',
    'BOM_DEACTIVATE',
    'MATERIAL_REQUIREMENT_VIEW',
  ],
  ACCOUNTING_ERP: [
    'CUSTOMER_VIEW',
    'PRODUCT_VIEW',
    'ORDER_VIEW',
    'SUPPLIER_VIEW',
    'MATERIAL_VIEW',
    'WAREHOUSE_VIEW',
    'INVENTORY_VIEW',
    'INVENTORY_TRANSACTION_VIEW',
  ],
  LINE_LEADER: [
    'PRODUCT_VIEW',
    'ORDER_VIEW',
    'MATERIAL_VIEW',
    'INVENTORY_VIEW',
    'MATERIAL_REQUIREMENT_VIEW',
  ],
  QC: [
    'PRODUCT_VIEW',
    'ORDER_VIEW',
    'MATERIAL_VIEW',
    'INVENTORY_VIEW',
  ],
};

const run = async () => {
  await transaction(async (connection) => {
    for (const [code, name] of roles) {
      await connection.execute(
        `
          INSERT INTO roles (code, name)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name)
        `,
        [code, name],
      );
    }

    for (const [code, name] of permissions) {
      await connection.execute(
        `
          INSERT INTO permissions (code, name)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name)
        `,
        [code, name],
      );
    }

    await connection.execute(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      SELECT roles.id, permissions.id
      FROM roles
      CROSS JOIN permissions
      WHERE roles.code = 'ADMIN'
    `);

    for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMap)) {
      for (const permissionCode of permissionCodes) {
        await connection.execute(
          `
            INSERT IGNORE INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN permissions ON permissions.code = ?
            WHERE roles.code = ?
          `,
          [permissionCode, roleCode],
        );
      }
    }

    const [adminRoles] = await connection.execute('SELECT id FROM roles WHERE code = ?', ['ADMIN']);
    const adminRole = adminRoles[0];
    const passwordHash = await bcrypt.hash(env.DEV_ADMIN_PASSWORD, 10);

    await connection.execute(
      `
        INSERT INTO users (username, email, full_name, password_hash, role_id)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          full_name = VALUES(full_name),
          password_hash = VALUES(password_hash),
          role_id = VALUES(role_id),
          is_locked = FALSE
      `,
      [env.DEV_ADMIN_USERNAME, env.DEV_ADMIN_EMAIL, 'Development Admin', passwordHash, adminRole.id],
    );

    const [adminUsers] = await connection.execute('SELECT id FROM users WHERE username = ?', [
      env.DEV_ADMIN_USERNAME,
    ]);
    const adminUser = adminUsers[0];

    await connection.execute(
      `
        INSERT INTO customers
          (customer_code, customer_name, contact_person, phone, email, address, tax_code, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          customer_name = VALUES(customer_name),
          contact_person = VALUES(contact_person),
          phone = VALUES(phone),
          email = VALUES(email),
          address = VALUES(address),
          tax_code = VALUES(tax_code),
          notes = VALUES(notes),
          is_active = TRUE
      `,
      [
        'CUS-DEMO-001',
        'Cong ty May Demo',
        'Nguyen Van A',
        '0900000001',
        'customer-demo@example.com',
        'Quan 1, TP.HCM',
        '0312345678',
        'Khach hang mau cho development',
        adminUser.id,
      ],
    );

    await connection.execute(
      `
        INSERT INTO products
          (product_code, product_name, category, unit, description, standard_time_minutes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name = VALUES(product_name),
          category = VALUES(category),
          unit = VALUES(unit),
          description = VALUES(description),
          standard_time_minutes = VALUES(standard_time_minutes),
          is_active = TRUE
      `,
      ['PRO-DEMO-001', 'Ao so mi demo', 'Ao so mi', 'cai', 'San pham mau', 45, adminUser.id],
    );

    await connection.execute(
      `
        INSERT INTO products
          (product_code, product_name, category, unit, description, standard_time_minutes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name = VALUES(product_name),
          category = VALUES(category),
          unit = VALUES(unit),
          description = VALUES(description),
          standard_time_minutes = VALUES(standard_time_minutes),
          is_active = TRUE
      `,
      ['PRO-DEMO-002', 'Quan tay demo', 'Quan', 'cai', 'San pham mau', 60, adminUser.id],
    );

    // Seed Suppliers
    const suppliersData = [
      ['SPL-001', 'Cong ty Vai Thanh Cong', 'Nguyen Van B', '0901111222', 'supplier1@example.com', 'Binh Tan, TP.HCM', '0301234567', 'Nha cung cap vai chinh', adminUser.id],
      ['SPL-002', 'Cong ty Chi Phong Phu', 'Tran Van C', '0903333444', 'supplier2@example.com', 'Quan 9, TP.HCM', '0307654321', 'Nha cung cap chi may', adminUser.id],
      ['SPL-003', 'Phu lieu may Kim Long', 'Le Thi D', '0905555666', 'supplier3@example.com', 'Tan Binh, TP.HCM', '0309876543', 'Nha cung cap cuc, khoa keo', adminUser.id],
    ];
    for (const sup of suppliersData) {
      await connection.execute(
        `
          INSERT INTO suppliers
            (supplier_code, supplier_name, contact_person, phone, email, address, tax_code, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            supplier_name = VALUES(supplier_name),
            contact_person = VALUES(contact_person),
            phone = VALUES(phone),
            email = VALUES(email),
            address = VALUES(address),
            tax_code = VALUES(tax_code),
            notes = VALUES(notes),
            is_active = TRUE
        `,
        sup,
      );
    }

    const [supplierRows] = await connection.execute('SELECT id, supplier_code FROM suppliers');
    const supplierMap = Object.fromEntries(supplierRows.map((r) => [r.supplier_code, r.id]));

    // Seed Warehouses
    const warehousesData = [
      ['WH-MAIN', 'Kho Nguyen Lieu Chinh', 'Khu vuc A, Tang 1', 'Kho luu tru vai va phu lieu chinh', adminUser.id],
      ['WH-SUB', 'Kho Phu Lieu Phu', 'Khu vuc B, Tang 2', 'Kho phu luu cuc, chi, bao bi', adminUser.id],
    ];
    for (const wh of warehousesData) {
      await connection.execute(
        `
          INSERT INTO warehouses
            (warehouse_code, warehouse_name, location, description, created_by)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            warehouse_name = VALUES(warehouse_name),
            location = VALUES(location),
            description = VALUES(description),
            is_active = TRUE
        `,
        wh,
      );
    }

    const [warehouseRows] = await connection.execute('SELECT id, warehouse_code FROM warehouses');
    const warehouseMap = Object.fromEntries(warehouseRows.map((r) => [r.warehouse_code, r.id]));

    // Seed Materials
    const materialsData = [
      ['MAT-FAB-001', 'Vai Cotton Trang', 'FABRIC', 'm', 'Trang', '100% Cotton', 500, supplierMap['SPL-001'], 'Vai cotton trang may ao so mi', adminUser.id],
      ['MAT-FAB-002', 'Vai Kaki Den', 'FABRIC', 'm', 'Den', 'Kaki day', 300, supplierMap['SPL-001'], 'Vai kaki den may quan tay', adminUser.id],
      ['MAT-THR-001', 'Chi May 40/2 Trang', 'THREAD', 'cuon', 'Trang', 'Polyester spun', 50, supplierMap['SPL-002'], 'Chi may trang', adminUser.id],
      ['MAT-THR-002', 'Chi May 40/2 Den', 'THREAD', 'cuon', 'Den', 'Polyester spun', 50, supplierMap['SPL-002'], 'Chi may den', adminUser.id],
      ['MAT-BUT-001', 'Nut Ao 4 Lo Nhua', 'BUTTON', 'cai', 'Trang', '11.5mm', 1000, supplierMap['SPL-003'], 'Nut ao so mi', adminUser.id],
      ['MAT-ZIP-001', 'Khoa Keo YKK Den', 'ZIPPER', 'cai', 'Den', '20cm', 200, supplierMap['SPL-003'], 'Khoa keo quan tay', adminUser.id],
      ['MAT-LBL-001', 'Nhan Co Ao Cotton', 'LABEL', 'cai', 'Trang', 'Det chu noi', 500, supplierMap['SPL-003'], 'Nhan co ao so mi', adminUser.id],
      ['MAT-PKG-001', 'Tui Nilon Dong Goi', 'PACKAGING', 'cai', 'Trong suot', '30x40cm', 1000, supplierMap['SPL-003'], 'Tui dung san pham', adminUser.id],
      ['MAT-ACC-001', 'Day Thun Lung Chun', 'ACCESSORY', 'm', 'Trang', 'Ban rong 3cm', 100, supplierMap['SPL-003'], 'Day thun lung quan', adminUser.id],
      ['MAT-OTH-001', 'Phan May Bot Kho', 'OTHER', 'hop', 'Xanh/Hong', 'Bot hop 10 vien', 5, supplierMap['SPL-003'], 'Phan ve may', adminUser.id],
    ];
    for (const mat of materialsData) {
      await connection.execute(
        `
          INSERT INTO materials
            (material_code, material_name, category, unit, color, specification, minimum_stock, default_supplier_id, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            material_name = VALUES(material_name),
            category = VALUES(category),
            unit = VALUES(unit),
            color = VALUES(color),
            specification = VALUES(specification),
            minimum_stock = VALUES(minimum_stock),
            default_supplier_id = VALUES(default_supplier_id),
            notes = VALUES(notes),
            is_active = TRUE
        `,
        mat,
      );
    }

    const [materialRows] = await connection.execute('SELECT id, material_code FROM materials');
    const materialMap = Object.fromEntries(materialRows.map((r) => [r.material_code, r.id]));

    // Seed BOM for PRO-DEMO-001
    const [p1] = await connection.execute('SELECT id FROM products WHERE product_code = ?', ['PRO-DEMO-001']);
    if (p1[0]) {
      const prodId = p1[0].id;
      const [existingBoms] = await connection.execute('SELECT id FROM boms WHERE product_id = ? AND version = ?', [prodId, 'V1.0']);
      let bomId;
      if (existingBoms.length === 0) {
        const [bomResult] = await connection.execute(
          `
            INSERT INTO boms (product_id, version, status, effective_date, notes, created_by, updated_by)
            VALUES (?, 'V1.0', 'ACTIVE', CURDATE(), 'BOM phien ban dau cho Ao so mi', ?, ?)
          `,
          [prodId, adminUser.id, adminUser.id],
        );
        bomId = bomResult.insertId;
      } else {
        bomId = existingBoms[0].id;
        await connection.execute('UPDATE boms SET status = \'ACTIVE\' WHERE id = ?', [bomId]);
      }

      const bomItems = [
        [bomId, materialMap['MAT-FAB-001'], 1.2, 5.0],
        [bomId, materialMap['MAT-THR-001'], 0.1, 2.0],
        [bomId, materialMap['MAT-BUT-001'], 6.0, 0.0],
        [bomId, materialMap['MAT-LBL-001'], 1.0, 0.0],
        [bomId, materialMap['MAT-PKG-001'], 1.0, 0.0],
      ];
      for (const item of bomItems) {
        await connection.execute(
          `
            INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, waste_rate_percent)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity_per_unit = VALUES(quantity_per_unit),
              waste_rate_percent = VALUES(waste_rate_percent)
          `,
          item,
        );
      }
    }

    // Seed BOM for PRO-DEMO-002
    const [p2] = await connection.execute('SELECT id FROM products WHERE product_code = ?', ['PRO-DEMO-002']);
    if (p2[0]) {
      const prodId = p2[0].id;
      const [existingBoms] = await connection.execute('SELECT id FROM boms WHERE product_id = ? AND version = ?', [prodId, 'V1.0']);
      let bomId;
      if (existingBoms.length === 0) {
        const [bomResult] = await connection.execute(
          `
            INSERT INTO boms (product_id, version, status, effective_date, notes, created_by, updated_by)
            VALUES (?, 'V1.0', 'ACTIVE', CURDATE(), 'BOM phien ban dau cho Quan tay', ?, ?)
          `,
          [prodId, adminUser.id, adminUser.id],
        );
        bomId = bomResult.insertId;
      } else {
        bomId = existingBoms[0].id;
        await connection.execute('UPDATE boms SET status = \'ACTIVE\' WHERE id = ?', [bomId]);
      }

      const bomItems = [
        [bomId, materialMap['MAT-FAB-002'], 1.5, 4.0],
        [bomId, materialMap['MAT-THR-002'], 0.15, 3.0],
        [bomId, materialMap['MAT-BUT-001'], 1.0, 0.0],
        [bomId, materialMap['MAT-ZIP-001'], 1.0, 0.0],
        [bomId, materialMap['MAT-PKG-001'], 1.0, 0.0],
        [bomId, materialMap['MAT-ACC-001'], 0.8, 2.0],
      ];
      for (const item of bomItems) {
        await connection.execute(
          `
            INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, waste_rate_percent)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity_per_unit = VALUES(quantity_per_unit),
              waste_rate_percent = VALUES(waste_rate_percent)
          `,
          item,
        );
      }
    }

    // Seed RCV-DEMO-001 (WH-MAIN)
    const txCode = 'RCV-DEMO-001';
    const [existingTx] = await connection.execute('SELECT id FROM inventory_transactions WHERE transaction_code = ?', [txCode]);
    if (existingTx.length === 0) {
      const [txResult] = await connection.execute(
        `
          INSERT INTO inventory_transactions
            (transaction_code, transaction_type, warehouse_id, supplier_id, transaction_date, reference_number, notes, status, created_by, posted_by, posted_at)
          VALUES (?, 'RECEIPT', ?, ?, CURDATE(), 'REF-0001', 'Phieu nhap kho ban dau', 'POSTED', ?, ?, NOW())
        `,
        [txCode, warehouseMap['WH-MAIN'], supplierMap['SPL-001'], adminUser.id, adminUser.id],
      );
      const txId = txResult.insertId;

      const txItems = [
        [txId, materialMap['MAT-FAB-001'], 1000.0, 45000.0],
        [txId, materialMap['MAT-FAB-002'], 800.0, 60000.0],
        [txId, materialMap['MAT-THR-001'], 100.0, 15000.0],
        [txId, materialMap['MAT-THR-002'], 100.0, 15000.0],
      ];
      for (const item of txItems) {
        await connection.execute(
          `
            INSERT INTO inventory_transaction_items (inventory_transaction_id, material_id, quantity, unit_cost)
            VALUES (?, ?, ?, ?)
          `,
          item,
        );

        await connection.execute(
          `
            INSERT INTO inventory_balances (warehouse_id, material_id, quantity_on_hand)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity_on_hand = quantity_on_hand + VALUES(quantity_on_hand)
          `,
          [warehouseMap['WH-MAIN'], item[1], item[2]],
        );
      }
    }

    // Seed RCV-DEMO-002 (WH-SUB)
    const txCode2 = 'RCV-DEMO-002';
    const [existingTx2] = await connection.execute('SELECT id FROM inventory_transactions WHERE transaction_code = ?', [txCode2]);
    if (existingTx2.length === 0) {
      const [txResult2] = await connection.execute(
        `
          INSERT INTO inventory_transactions
            (transaction_code, transaction_type, warehouse_id, supplier_id, transaction_date, reference_number, notes, status, created_by, posted_by, posted_at)
          VALUES (?, 'RECEIPT', ?, ?, CURDATE(), 'REF-0002', 'Phieu nhap kho phu lieu ban dau', 'POSTED', ?, ?, NOW())
        `,
        [txCode2, warehouseMap['WH-SUB'], supplierMap['SPL-003'], adminUser.id, adminUser.id],
      );
      const txId2 = txResult2.insertId;

      const txItems2 = [
        [txId2, materialMap['MAT-BUT-001'], 5000.0, 500.0],
        [txId2, materialMap['MAT-ZIP-001'], 500.0, 5000.0],
        [txId2, materialMap['MAT-LBL-001'], 1000.0, 1000.0],
        [txId2, materialMap['MAT-PKG-001'], 2000.0, 800.0],
        [txId2, materialMap['MAT-ACC-001'], 500.0, 8000.0],
      ];
      for (const item of txItems2) {
        await connection.execute(
          `
            INSERT INTO inventory_transaction_items (inventory_transaction_id, material_id, quantity, unit_cost)
            VALUES (?, ?, ?, ?)
          `,
          item,
        );

        await connection.execute(
          `
            INSERT INTO inventory_balances (warehouse_id, material_id, quantity_on_hand)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity_on_hand = quantity_on_hand + VALUES(quantity_on_hand)
          `,
          [warehouseMap['WH-SUB'], item[1], item[2]],
        );
      }
    }

    const [customers] = await connection.execute(
      'SELECT id FROM customers WHERE customer_code = ?',
      ['CUS-DEMO-001'],
    );
    const [products] = await connection.execute(
      'SELECT id, product_code FROM products WHERE product_code IN (?, ?)',
      ['PRO-DEMO-001', 'PRO-DEMO-002'],
    );
    const [existingOrders] = await connection.execute(
      'SELECT id FROM orders WHERE order_code = ?',
      ['ORD-DEMO-001'],
    );

    if (customers[0] && products.length >= 2 && existingOrders.length === 0) {
      const [orderResult] = await connection.execute(
        `
          INSERT INTO orders
            (order_code, customer_id, order_date, expected_delivery_date, priority, status, notes, created_by, updated_by)
          VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'NORMAL', 'DRAFT', ?, ?, ?)
        `,
        ['ORD-DEMO-001', customers[0].id, 'Don hang mau cho development', adminUser.id, adminUser.id],
      );

      for (const product of products) {
        await connection.execute(
          `
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, color, size)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            orderResult.insertId,
            product.id,
            product.product_code === 'PRO-DEMO-001' ? 100 : 80,
            product.product_code === 'PRO-DEMO-001' ? 120000 : 180000,
            product.product_code === 'PRO-DEMO-001' ? 'Trang' : 'Den',
            product.product_code === 'PRO-DEMO-001' ? 'M' : 'L',
          ],
        );
      }

      await connection.execute(
        `
          INSERT INTO order_status_histories (order_id, from_status, to_status, changed_by, change_note)
          VALUES (?, NULL, 'DRAFT', ?, ?)
        `,
        [orderResult.insertId, adminUser.id, 'Tao don hang mau'],
      );
    }

    await connection.execute(
      `
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('phase', 'phase3-inventory-bom')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `,
    );
  });


  const [adminUser] = await query('SELECT username, email FROM users WHERE username = ?', [
    env.DEV_ADMIN_USERNAME,
  ]);

  console.log('Seed completed');
  console.log(`Development admin: ${adminUser.username} / ${adminUser.email}`);
};

run()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
