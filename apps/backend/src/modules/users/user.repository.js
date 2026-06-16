import { query } from '../../config/database.js';

const rolePermissions = {
  ADMIN: ['*'],
  FACTORY_MANAGER: ['PRODUCTION_PLAN_VIEW', 'PRODUCTION_PLAN_CREATE', 'PRODUCTION_PLAN_UPDATE', 'PRODUCTION_PLAN_ASSIGN_EMPLOYEE'],
  PRODUCTION_MANAGER: ['PRODUCTION_PLAN_VIEW', 'PRODUCTION_PLAN_CREATE', 'PRODUCTION_PLAN_UPDATE', 'PRODUCTION_PLAN_ASSIGN_EMPLOYEE'],
  LINE_LEADER: ['PRODUCTION_PLAN_VIEW', 'PRODUCTION_PLAN_ASSIGN_EMPLOYEE'],
  QC: ['PRODUCTION_PLAN_VIEW'],
  WAREHOUSE: ['INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_UPDATE'],
  TECHNICIAN: ['PRODUCTION_PLAN_VIEW'],
  HR: ['EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE'],
  ACCOUNTANT: ['INVENTORY_VIEW'],
  WORKER: ['PRODUCTION_PLAN_VIEW'],
};

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash,
    isLocked: Boolean(row.is_locked),
    roles: row.role_code ? [row.role_code] : [],
    permissions: rolePermissions[row.role_code] ?? [],
  };
};

export const userRepository = {
  async findByUsernameOrEmail(identifier) {
    const rows = await query(
      `
        SELECT users.*, roles.code AS role_code
        FROM users
        INNER JOIN roles ON roles.id = users.role_id
        WHERE users.username = ? OR users.email = ?
        LIMIT 1
      `,
      [identifier, identifier],
    );

    return mapUser(rows[0]);
  },

  async findByIdWithAccess(userId) {
    const rows = await query(
      `
        SELECT users.*, roles.code AS role_code
        FROM users
        INNER JOIN roles ON roles.id = users.role_id
        WHERE users.id = ?
        LIMIT 1
      `,
      [userId],
    );

    return mapUser(rows[0]);
  },

  async updateLastLogin(userId) {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
  },

  async updatePasswordHash(userId, passwordHash) {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  },
};
