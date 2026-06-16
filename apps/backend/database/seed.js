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
];

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
