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
  ['ORDER_VIEW', 'Xem don hang'],
  ['ORDER_CREATE', 'Tao don hang'],
  ['ORDER_UPDATE', 'Cap nhat don hang'],
  ['ORDER_STATUS_UPDATE', 'Cap nhat trang thai don hang'],
  ['ORDER_CANCEL', 'Huy don hang'],
];

const rolePermissionMap = {
  OWNER: ['CUSTOMER_VIEW', 'PRODUCT_VIEW', 'ORDER_VIEW'],
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
  ],
  ACCOUNTING_ERP: ['CUSTOMER_VIEW', 'PRODUCT_VIEW', 'ORDER_VIEW'],
  LINE_LEADER: ['PRODUCT_VIEW', 'ORDER_VIEW'],
  QC: ['PRODUCT_VIEW', 'ORDER_VIEW'],
  WAREHOUSE: ['PRODUCT_VIEW', 'ORDER_VIEW'],
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
        VALUES ('phase', 'foundation-auth-mysql')
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
