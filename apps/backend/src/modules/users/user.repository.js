import { query } from '../../config/database.js';

const mapUser = (row, permissions = []) => {
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
    permissions,
  };
};

const getPermissionsByRoleId = async (roleId) => {
  const rows = await query(
    `
      SELECT permissions.code
      FROM permissions
      INNER JOIN role_permissions ON role_permissions.permission_id = permissions.id
      WHERE role_permissions.role_id = ?
      ORDER BY permissions.code ASC
    `,
    [roleId],
  );

  return rows.map((row) => row.code);
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

    const row = rows[0];
    if (!row) {
      return null;
    }

    const permissions = await getPermissionsByRoleId(row.role_id);
    return mapUser(row, permissions);
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

    const row = rows[0];
    if (!row) {
      return null;
    }

    const permissions = await getPermissionsByRoleId(row.role_id);
    return mapUser(row, permissions);
  },

  async updateLastLogin(userId) {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
  },

  async updatePasswordHash(userId, passwordHash) {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  },
};
