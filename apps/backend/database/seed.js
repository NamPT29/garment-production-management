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

  // Phase 4 Permissions
  ['PRODUCTION_LINE_VIEW', 'Xem chuyen may'],
  ['PRODUCTION_LINE_CREATE', 'Tao chuyen may'],
  ['PRODUCTION_LINE_UPDATE', 'Cap nhat chuyen may'],
  ['PRODUCTION_LINE_DEACTIVATE', 'Ngung hoat dong chuyen may'],
  ['EMPLOYEE_VIEW', 'Xem nhan su san xuat'],
  ['EMPLOYEE_CREATE', 'Tao nhan su san xuat'],
  ['EMPLOYEE_UPDATE', 'Cap nhat nhan su san xuat'],
  ['EMPLOYEE_DEACTIVATE', 'Ngung hoat dong nhan su san xuat'],
  ['EMPLOYEE_ASSIGN_LINE', 'Phan cong nhan vien vao chuyen'],
  ['SHIFT_VIEW', 'Xem ca lam viec'],
  ['SHIFT_CREATE', 'Tao ca lam viec'],
  ['SHIFT_UPDATE', 'Cap nhat ca lam viec'],
  ['OPERATION_VIEW', 'Xem danh muc cong doan'],
  ['OPERATION_CREATE', 'Tao cong doan'],
  ['OPERATION_UPDATE', 'Cap nhat cong doan'],
  ['PRODUCT_OPERATION_MANAGE', 'Quan ly quy trinh cong doan san pham'],
  ['PRODUCTION_ORDER_VIEW', 'Xem lenh san xuat'],
  ['PRODUCTION_ORDER_CREATE', 'Tao lenh san xuat'],
  ['PRODUCTION_ORDER_UPDATE', 'Cap nhat lenh san xuat'],
  ['PRODUCTION_ORDER_RELEASE', 'Phat hanh lenh san xuat'],
  ['PRODUCTION_ORDER_CANCEL', 'Huy lenh san xuat'],
  ['PRODUCTION_PLAN_VIEW', 'Xem ke hoach san xuat'],
  ['PRODUCTION_PLAN_CREATE', 'Tao ke hoach san xuat'],
  ['PRODUCTION_PLAN_UPDATE', 'Cap nhat ke hoach san xuat'],
  ['PRODUCTION_PLAN_CONFIRM', 'Xac nhan ke hoach san xuat'],
  ['PRODUCTION_PLAN_ASSIGN_EMPLOYEE', 'Phan cong nhan su cho ke hoach'],
  ['PRODUCTION_OUTPUT_VIEW', 'Xem bao cao san luong'],
  ['PRODUCTION_OUTPUT_CREATE', 'Ghi nhan san luong thuc te'],
  ['PRODUCTION_OUTPUT_UPDATE', 'Cap nhat phieu san luong'],
  ['EMPLOYEE_OUTPUT_VIEW', 'Xem san luong ca nhan'],
  ['PRODUCTION_PROGRESS_VIEW', 'Xem tien do san xuat'],
  ['PRODUCTION_DASHBOARD_VIEW', 'Xem dashboard dieu hanh san xuat'],
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
    // Phase 4
    'PRODUCTION_LINE_VIEW',
    'EMPLOYEE_VIEW',
    'SHIFT_VIEW',
    'OPERATION_VIEW',
    'PRODUCTION_ORDER_VIEW',
    'PRODUCTION_PLAN_VIEW',
    'PRODUCTION_OUTPUT_VIEW',
    'PRODUCTION_PROGRESS_VIEW',
    'PRODUCTION_DASHBOARD_VIEW',
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
    // Phase 4
    'PRODUCTION_LINE_VIEW',
    'PRODUCTION_LINE_CREATE',
    'PRODUCTION_LINE_UPDATE',
    'PRODUCTION_LINE_DEACTIVATE',
    'EMPLOYEE_VIEW',
    'EMPLOYEE_CREATE',
    'EMPLOYEE_UPDATE',
    'EMPLOYEE_DEACTIVATE',
    'EMPLOYEE_ASSIGN_LINE',
    'SHIFT_VIEW',
    'SHIFT_CREATE',
    'SHIFT_UPDATE',
    'OPERATION_VIEW',
    'OPERATION_CREATE',
    'OPERATION_UPDATE',
    'PRODUCT_OPERATION_MANAGE',
    'PRODUCTION_ORDER_VIEW',
    'PRODUCTION_ORDER_CREATE',
    'PRODUCTION_ORDER_UPDATE',
    'PRODUCTION_ORDER_RELEASE',
    'PRODUCTION_ORDER_CANCEL',
    'PRODUCTION_PLAN_VIEW',
    'PRODUCTION_PLAN_CREATE',
    'PRODUCTION_PLAN_UPDATE',
    'PRODUCTION_PLAN_CONFIRM',
    'PRODUCTION_PLAN_ASSIGN_EMPLOYEE',
    'PRODUCTION_OUTPUT_VIEW',
    'PRODUCTION_OUTPUT_CREATE',
    'PRODUCTION_OUTPUT_UPDATE',
    'EMPLOYEE_OUTPUT_VIEW',
    'PRODUCTION_PROGRESS_VIEW',
    'PRODUCTION_DASHBOARD_VIEW',
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
    // Phase 4
    'PRODUCTION_ORDER_VIEW',
    'PRODUCTION_PLAN_VIEW',
  ],
  TECHNICIAN: [
    'MATERIAL_VIEW',
    'BOM_VIEW',
    'BOM_CREATE',
    'BOM_UPDATE',
    'BOM_ACTIVATE',
    'BOM_DEACTIVATE',
    'MATERIAL_REQUIREMENT_VIEW',
    // Phase 4
    'PRODUCTION_LINE_VIEW',
    'OPERATION_VIEW',
    'PRODUCT_OPERATION_MANAGE',
    'PRODUCTION_PLAN_VIEW',
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
    // Phase 4
    'PRODUCTION_LINE_VIEW',
    'EMPLOYEE_VIEW',
    'PRODUCTION_ORDER_VIEW',
    'PRODUCTION_PLAN_VIEW',
    'PRODUCTION_PLAN_ASSIGN_EMPLOYEE',
    'PRODUCTION_OUTPUT_VIEW',
    'PRODUCTION_OUTPUT_CREATE',
    'EMPLOYEE_OUTPUT_VIEW',
    'PRODUCTION_PROGRESS_VIEW',
  ],
  QC: [
    'PRODUCT_VIEW',
    'ORDER_VIEW',
    'MATERIAL_VIEW',
    'INVENTORY_VIEW',
    // Phase 4
    'PRODUCTION_ORDER_VIEW',
    'PRODUCTION_PLAN_VIEW',
    'PRODUCTION_OUTPUT_VIEW',
  ],
  HR: [
    // Phase 4
    'EMPLOYEE_VIEW',
    'EMPLOYEE_CREATE',
    'EMPLOYEE_UPDATE',
    'EMPLOYEE_DEACTIVATE',
    'EMPLOYEE_ASSIGN_LINE',
    'SHIFT_VIEW',
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

    // === Phase 4 Seed Data ===
    // 1. Seed Shifts
    const shiftsData = [
      ['SH-MORNING', 'Ca sang', '06:00:00', '14:00:00', 30, true, adminUser.id],
      ['SH-AFTERNOON', 'Ca chieu', '14:00:00', '22:00:00', 30, true, adminUser.id],
      ['SH-EVENING', 'Ca dem', '22:00:00', '06:00:00', 30, true, adminUser.id]
    ];
    for (const sh of shiftsData) {
      await connection.execute(
        `
          INSERT INTO shifts (shift_code, shift_name, start_time, end_time, break_minutes, is_active, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            shift_name = VALUES(shift_name),
            start_time = VALUES(start_time),
            end_time = VALUES(end_time),
            break_minutes = VALUES(break_minutes),
            is_active = VALUES(is_active)
        `,
        sh
      );
    }
    const [shiftRows] = await connection.execute('SELECT id, shift_code FROM shifts');
    const shiftMap = Object.fromEntries(shiftRows.map((r) => [r.shift_code, r.id]));

    // 2. Seed Operations
    const operationsData = [
      ['OP-CUT', 'Cat vai', 'Cat vai theo so do thiet ke', 60, 'MEDIUM', true, adminUser.id],
      ['OP-SEW-COLLAR', 'May co ao', 'May rap co ao', 180, 'HIGH', true, adminUser.id],
      ['OP-SEW-SLEEVE', 'May tay ao', 'May rap tay vao than ao', 120, 'MEDIUM', true, adminUser.id],
      ['OP-SEW-BODY', 'May than ao', 'May rap than ao', 240, 'HIGH', true, adminUser.id],
      ['OP-BUTTON', 'Dinh nut', 'Dinh nut va mo khuy', 90, 'LOW', true, adminUser.id]
    ];
    for (const op of operationsData) {
      await connection.execute(
        `
          INSERT INTO operations (operation_code, operation_name, description, standard_time_seconds, difficulty_level, is_active, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            operation_name = VALUES(operation_name),
            description = VALUES(description),
            standard_time_seconds = VALUES(standard_time_seconds),
            difficulty_level = VALUES(difficulty_level),
            is_active = VALUES(is_active)
        `,
        op
      );
    }
    const [opRows] = await connection.execute('SELECT id, operation_code FROM operations');
    const opMap = Object.fromEntries(opRows.map((r) => [r.operation_code, r.id]));

    // 3. Seed Production Lines
    const linesData = [
      ['PL-001', 'Chuyen may 01', 'Tang 1 - Zone A', 5, 10, 'ACTIVE', 'Chuyen chuyen may ao so mi', adminUser.id],
      ['PL-002', 'Chuyen may 02', 'Tang 1 - Zone B', 5, 10, 'ACTIVE', 'Chuyen chuyen may quan tay', adminUser.id],
      ['PL-003', 'Chuyen may 03', 'Tang 2 - Zone A', 5, 10, 'ACTIVE', 'Chuyen may jacket va thoi trang', adminUser.id]
    ];
    for (const line of linesData) {
      await connection.execute(
        `
          INSERT INTO production_lines (line_code, line_name, location, target_workers, maximum_workers, status, description, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            line_name = VALUES(line_name),
            location = VALUES(location),
            target_workers = VALUES(target_workers),
            maximum_workers = VALUES(maximum_workers),
            status = VALUES(status),
            description = VALUES(description)
        `,
        line
      );
    }
    const [lineRows] = await connection.execute('SELECT id, line_code FROM production_lines');
    const lineMap = Object.fromEntries(lineRows.map((r) => [r.line_code, r.id]));

    // 4. Seed Employees
    const employeesData = [
      ['EMP-001', 'Nguyen Van To Truong', '1985-05-15', 'NAM', '0912345671', 'to_truong@example.com', 'Ho Chi Minh', '2020-01-10', 'LINE_LEADER', 'EXPERT', 'ACTIVE', adminUser.id],
      ['EMP-002', 'Tran Thi Cong Nhan 1', '1990-08-20', 'NU', '0912345672', 'worker1@example.com', 'Ho Chi Minh', '2021-02-15', 'WORKER', 'SKILLED', 'ACTIVE', adminUser.id],
      ['EMP-003', 'Tran Thi Cong Nhan 2', '1992-09-22', 'NU', '0912345673', 'worker2@example.com', 'Ho Chi Minh', '2021-02-15', 'WORKER', 'SKILLED', 'ACTIVE', adminUser.id],
      ['EMP-004', 'Tran Thi Cong Nhan 3', '1991-03-10', 'NU', '0912345674', 'worker3@example.com', 'Ho Chi Minh', '2021-03-01', 'WORKER', 'INTERMEDIATE', 'ACTIVE', adminUser.id],
      ['EMP-005', 'Tran Thi Cong Nhan 4', '1995-04-12', 'NU', '0912345675', 'worker4@example.com', 'Ho Chi Minh', '2021-03-01', 'WORKER', 'INTERMEDIATE', 'ACTIVE', adminUser.id],
      ['EMP-006', 'Tran Thi Cong Nhan 5', '1996-06-18', 'NU', '0912345676', 'worker5@example.com', 'Ho Chi Minh', '2021-03-01', 'WORKER', 'BEGINNER', 'ACTIVE', adminUser.id],
      ['EMP-007', 'Nguyen Van Cong Nhan 6', '1993-01-25', 'NAM', '0912345677', 'worker6@example.com', 'Ho Chi Minh', '2021-04-10', 'WORKER', 'SKILLED', 'ACTIVE', adminUser.id],
      ['EMP-008', 'Nguyen Van Cong Nhan 7', '1994-07-14', 'NAM', '0912345678', 'worker7@example.com', 'Ho Chi Minh', '2021-04-10', 'WORKER', 'SKILLED', 'ACTIVE', adminUser.id],
      ['EMP-009', 'Nguyen Van Cong Nhan 8', '1990-11-30', 'NAM', '0912345679', 'worker8@example.com', 'Ho Chi Minh', '2021-04-10', 'WORKER', 'INTERMEDIATE', 'ACTIVE', adminUser.id],
      ['EMP-010', 'Nguyen Van Cong Nhan 9', '1992-12-05', 'NAM', '0912345680', 'worker9@example.com', 'Ho Chi Minh', '2021-05-01', 'WORKER', 'INTERMEDIATE', 'ACTIVE', adminUser.id],
      ['EMP-011', 'Nguyen Van Cong Nhan 10', '1997-02-14', 'NAM', '0912345681', 'worker10@example.com', 'Ho Chi Minh', '2021-05-01', 'WORKER', 'BEGINNER', 'ACTIVE', adminUser.id],
      ['EMP-012', 'Le Thi Cong Nhan 11', '1994-03-24', 'NU', '0912345682', 'worker11@example.com', 'Ho Chi Minh', '2022-01-10', 'WORKER', 'SKILLED', 'ACTIVE', adminUser.id],
      ['EMP-013', 'Le Thi Cong Nhan 12', '1995-05-28', 'NU', '0912345683', 'worker12@example.com', 'Ho Chi Minh', '2022-01-10', 'WORKER', 'INTERMEDIATE', 'ACTIVE', adminUser.id],
      ['EMP-014', 'Le Thi Cong Nhan 13', '1996-08-01', 'NU', '0912345684', 'worker13@example.com', 'Ho Chi Minh', '2022-02-01', 'WORKER', 'INTERMEDIATE', 'ACTIVE', adminUser.id],
      ['EMP-015', 'Le Thi Cong Nhan 14', '1993-10-15', 'NU', '0912345685', 'worker14@example.com', 'Ho Chi Minh', '2022-02-01', 'WORKER', 'BEGINNER', 'ACTIVE', adminUser.id],
      ['EMP-016', 'Le Thi Cong Nhan 15', '1998-04-05', 'NU', '0912345686', 'worker15@example.com', 'Ho Chi Minh', '2022-02-15', 'WORKER', 'BEGINNER', 'ACTIVE', adminUser.id]
    ];
    for (const emp of employeesData) {
      await connection.execute(
        `
          INSERT INTO employees (
            employee_code, full_name, date_of_birth, gender, phone, email, address, hire_date, position, skill_level, status, created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            full_name = VALUES(full_name),
            date_of_birth = VALUES(date_of_birth),
            gender = VALUES(gender),
            phone = VALUES(phone),
            email = VALUES(email),
            address = VALUES(address),
            hire_date = VALUES(hire_date),
            position = VALUES(position),
            skill_level = VALUES(skill_level),
            status = VALUES(status)
        `,
        emp
      );
    }
    const [empRows] = await connection.execute('SELECT id, employee_code FROM employees');
    const empMap = Object.fromEntries(empRows.map((r) => [r.employee_code, r.id]));

    // 5. Seed Line Employee Assignments (Primary Assignments)
    const [existingLineAssignments] = await connection.execute('SELECT COUNT(*) as count FROM line_employee_assignments');
    if (existingLineAssignments[0].count === 0) {
      const assignments = [
        [lineMap['PL-001'], empMap['EMP-001'], '2026-01-01', true, 'Leader chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-002'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-003'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-004'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-005'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-006'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-007'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-008'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-001'], empMap['EMP-009'], '2026-01-01', true, 'Cong nhan chuyen 1', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-010'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-011'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-012'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-013'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-014'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-015'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id],
        [lineMap['PL-002'], empMap['EMP-016'], '2026-01-01', true, 'Cong nhan chuyen 2', adminUser.id]
      ];
      for (const assign of assignments) {
        await connection.execute(
          `
            INSERT INTO line_employee_assignments (production_line_id, employee_id, assigned_from, is_primary, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          assign
        );
      }
    }

    // 6. Seed Product Operations Flow for PRO-DEMO-001 (Ao so mi demo)
    const [demoProductRows] = await connection.execute('SELECT id FROM products WHERE product_code = ?', ['PRO-DEMO-001']);
    if (demoProductRows[0]) {
      const pId = demoProductRows[0].id;
      const productOps = [
        [pId, opMap['OP-CUT'], 1, 60, 'BEGINNER', 'Cat vai theo mau thiet ke'],
        [pId, opMap['OP-SEW-COLLAR'], 2, 180, 'SKILLED', 'May rap co ao'],
        [pId, opMap['OP-SEW-SLEEVE'], 3, 120, 'INTERMEDIATE', 'May rap tay ao'],
        [pId, opMap['OP-SEW-BODY'], 4, 240, 'SKILLED', 'May rap than ao'],
        [pId, opMap['OP-BUTTON'], 5, 90, 'BEGINNER', 'Dinh nut ao']
      ];
      for (const po of productOps) {
        await connection.execute(
          `
            INSERT INTO product_operations (product_id, operation_id, sequence_number, standard_time_seconds, required_skill_level, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              standard_time_seconds = VALUES(standard_time_seconds),
              required_skill_level = VALUES(required_skill_level),
              notes = VALUES(notes)
          `,
          po
        );
      }
    }

    // 7. Seed Production Order
    const [orderRows] = await connection.execute('SELECT id FROM orders WHERE order_code = ?', ['ORD-DEMO-001']);
    if (orderRows[0] && demoProductRows[0]) {
      const orderId = orderRows[0].id;
      const pId = demoProductRows[0].id;
      
      const poCode = 'PO-2026-0001';
      const [existingPO] = await connection.execute('SELECT id FROM production_orders WHERE production_order_code = ?', [poCode]);
      let poId;
      if (existingPO.length === 0) {
        const [poResult] = await connection.execute(
          `
            INSERT INTO production_orders (
              production_order_code, order_id, product_id, planned_quantity, completed_quantity, rejected_quantity, 
              planned_start_date, planned_end_date, priority, status, notes, created_by, updated_by
            )
            VALUES (?, ?, ?, 100, 0, 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'NORMAL', 'RELEASED', 'Lenh san xuat mau', ?, ?)
          `,
          [poCode, orderId, pId, adminUser.id, adminUser.id]
        );
        poId = poResult.insertId;
      } else {
        poId = existingPO[0].id;
      }

      // 8. Seed Production Allocations (allocate 60 to PL-001, 40 to PL-002)
      const [existingAlloc] = await connection.execute('SELECT COUNT(*) as count FROM production_allocations WHERE production_order_id = ?', [poId]);
      let allocId1, allocId2;
      if (existingAlloc[0].count === 0) {
        const [allocRes1] = await connection.execute(
          `
            INSERT INTO production_allocations (production_order_id, production_line_id, allocated_quantity, planned_start_date, planned_end_date, status, created_by)
            VALUES (?, ?, 60, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'PLANNED', ?)
          `,
          [poId, lineMap['PL-001'], adminUser.id]
        );
        allocId1 = allocRes1.insertId;

        const [allocRes2] = await connection.execute(
          `
            INSERT INTO production_allocations (production_order_id, production_line_id, allocated_quantity, planned_start_date, planned_end_date, status, created_by)
            VALUES (?, ?, 40, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'PLANNED', ?)
          `,
          [poId, lineMap['PL-002'], adminUser.id]
        );
        allocId2 = allocRes2.insertId;
      } else {
        const [allocRows] = await connection.execute('SELECT id, production_line_id FROM production_allocations WHERE production_order_id = ?', [poId]);
        const allocMap = Object.fromEntries(allocRows.map(r => [r.production_line_id, r.id]));
        allocId1 = allocMap[lineMap['PL-001']];
        allocId2 = allocMap[lineMap['PL-002']];
      }

      // 9. Seed Production Schedules
      const [existingSched] = await connection.execute('SELECT COUNT(*) as count FROM production_schedules WHERE production_allocation_id IN (?, ?)', [allocId1, allocId2]);
      let schedId1, schedId2;
      if (existingSched[0].count === 0) {
        const [schedRes1] = await connection.execute(
          `
            INSERT INTO production_schedules (production_allocation_id, production_line_id, shift_id, schedule_date, target_quantity, planned_workers, status, created_by)
            VALUES (?, ?, ?, CURDATE(), 20, 5, 'CONFIRMED', ?)
          `,
          [allocId1, lineMap['PL-001'], shiftMap['SH-MORNING'], adminUser.id]
        );
        schedId1 = schedRes1.insertId;

        const [schedRes2] = await connection.execute(
          `
            INSERT INTO production_schedules (production_allocation_id, production_line_id, shift_id, schedule_date, target_quantity, planned_workers, status, created_by)
            VALUES (?, ?, ?, CURDATE(), 15, 5, 'CONFIRMED', ?)
          `,
          [allocId2, lineMap['PL-002'], shiftMap['SH-MORNING'], adminUser.id]
        );
        schedId2 = schedRes2.insertId;

        // 10. Seed Schedule Employee Assignments
        const sched1Assignments = [
          [schedId1, empMap['EMP-002'], opMap['OP-CUT'], 20, adminUser.id],
          [schedId1, empMap['EMP-003'], opMap['OP-SEW-COLLAR'], 20, adminUser.id],
          [schedId1, empMap['EMP-004'], opMap['OP-SEW-SLEEVE'], 20, adminUser.id],
          [schedId1, empMap['EMP-005'], opMap['OP-SEW-BODY'], 20, adminUser.id],
          [schedId1, empMap['EMP-006'], opMap['OP-BUTTON'], 20, adminUser.id]
        ];
        for (const sa of sched1Assignments) {
          await connection.execute(
            `
              INSERT INTO schedule_employee_assignments (production_schedule_id, employee_id, operation_id, assigned_quantity, created_by)
              VALUES (?, ?, ?, ?, ?)
            `,
            sa
          );
        }

        // 11. Seed Production Outputs
        const [outRes1] = await connection.execute(
          `
            INSERT INTO production_outputs (production_schedule_id, production_order_id, production_line_id, shift_id, output_date, good_quantity, defect_quantity, rework_quantity, working_minutes, downtime_minutes, recorded_by)
            VALUES (?, ?, ?, ?, CURDATE(), 18, 2, 1, 480, 20, ?)
          `,
          [schedId1, poId, lineMap['PL-001'], shiftMap['SH-MORNING'], adminUser.id]
        );
        const outId1 = outRes1.insertId;

        // 12. Seed Employee Outputs
        const empOutputs = [
          [outId1, empMap['EMP-002'], opMap['OP-CUT'], 20, 0, 480],
          [outId1, empMap['EMP-003'], opMap['OP-SEW-COLLAR'], 18, 2, 480],
          [outId1, empMap['EMP-004'], opMap['OP-SEW-SLEEVE'], 19, 1, 480],
          [outId1, empMap['EMP-005'], opMap['OP-SEW-BODY'], 18, 2, 480],
          [outId1, empMap['EMP-006'], opMap['OP-BUTTON'], 20, 0, 480]
        ];
        for (const eo of empOutputs) {
          await connection.execute(
            `
              INSERT INTO employee_outputs (production_output_id, employee_id, operation_id, good_quantity, defect_quantity, working_minutes)
              VALUES (?, ?, ?, ?, ?, ?)
            `,
            eo
          );
        }

        // Update production order completed quantity to 18
        await connection.execute(
          `
            UPDATE production_orders 
            SET completed_quantity = 18, rejected_quantity = 2, status = 'IN_PROGRESS', actual_start_date = CURDATE()
            WHERE id = ?
          `,
          [poId]
        );

        // 13. Seed Production Progress Snapshots
        await connection.execute(
          `
            INSERT INTO production_progress_snapshots (production_order_id, snapshot_date, planned_quantity, completed_quantity, remaining_quantity, progress_percent, expected_progress_percent, delay_quantity, status)
            VALUES (?, CURDATE(), 100, 18, 82, 18.00, 14.28, 0, 'ON_TRACK')
          `,
          [poId]
        );
      }
    }

    await connection.execute(
      `
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('phase', 'phase4-production')
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
