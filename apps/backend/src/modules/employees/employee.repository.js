import { query } from '../../config/database.js';

const toDateString = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  const d = new Date(val);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const mapEmployee = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    employeeCode: row.employee_code,
    fullName: row.full_name,
    dateOfBirth: toDateString(row.date_of_birth),
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    hireDate: toDateString(row.hire_date),
    position: row.position,
    skillLevel: row.skill_level,
    status: row.employee_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const employeeRepository = {
  async findMany(filters = {}) {
    const { status, position, search, page = 1, limit = 50, skip = 0 } = filters;
    const conditions = ['u.employee_code IS NOT NULL'];
    const params = [];

    if (status) {
      conditions.push('u.employee_status = ?');
      params.push(status);
    }
    if (position) {
      conditions.push('u.position = ?');
      params.push(position);
    }
    if (search) {
      conditions.push('(u.employee_code LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT u.*
        FROM users u
        ${whereSql}
        ORDER BY u.employee_code ASC
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM users u
        ${whereSql}
      `,
      params
    );

    return {
      items: rows.map(mapEmployee),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query(
      `
        SELECT u.*
        FROM users u
        WHERE u.id = ? AND u.employee_code IS NOT NULL
        LIMIT 1
      `,
      [id]
    );
    return mapEmployee(rows[0]);
  },

  async findByCode(code) {
    const rows = await query(
      'SELECT * FROM users WHERE employee_code = ? LIMIT 1',
      [code]
    );
    return mapEmployee(rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `
        INSERT INTO users (
          employee_code, full_name, date_of_birth, gender, phone, email, address,
          hire_date, position, skill_level, employee_status,
          username, password_hash, role_id, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 
          (SELECT id FROM roles WHERE code = 'WORKER' LIMIT 1),
          ?)
      `,
      [
        data.employeeCode,
        data.fullName,
        data.dateOfBirth ?? null,
        data.gender ?? null,
        data.phone ?? null,
        data.email ?? null,
        data.address ?? null,
        data.hireDate ?? null,
        data.position ?? 'WORKER',
        data.skillLevel ?? 'BEGINNER',
        data.status ?? 'ACTIVE',
        data.employeeCode, // username = employeeCode nếu không có tài khoản riêng
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    await query(
      `
        UPDATE users
        SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?,
            address = ?, hire_date = ?, position = ?, skill_level = ?, employee_status = ?
        WHERE id = ?
      `,
      [
        data.fullName,
        data.dateOfBirth ?? null,
        data.gender ?? null,
        data.phone ?? null,
        data.email ?? null,
        data.address ?? null,
        data.hireDate ?? null,
        data.position,
        data.skillLevel,
        data.status,
        id,
      ]
    );
    return this.findById(id);
  },
};
