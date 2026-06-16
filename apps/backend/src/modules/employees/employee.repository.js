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
    status: row.status,
    userId: row.user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentLineId: row.current_line_id ?? null,
    currentLineName: row.current_line_name ?? null,
  };
};

export const employeeRepository = {
  async findMany(filters = {}) {
    const { status, position, search, page = 1, limit = 50, skip = 0 } = filters;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }
    if (position) {
      conditions.push('e.position = ?');
      params.push(position);
    }
    if (search) {
      conditions.push('(e.employee_code LIKE ? OR e.full_name LIKE ? OR e.phone LIKE ? OR e.email LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    // Join with active assignment to get current line
    const rows = await query(
      `
        SELECT e.*, NULL AS current_line_id, NULL AS current_line_name
        FROM employees e
        ${whereSql}
        ORDER BY e.employee_code ASC
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM employees e
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
        SELECT e.*, NULL AS current_line_id, NULL AS current_line_name
        FROM employees e
        WHERE e.id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapEmployee(rows[0]);
  },

  async findByCode(code) {
    const rows = await query('SELECT * FROM employees WHERE employee_code = ? LIMIT 1', [code]);
    return mapEmployee(rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `
        INSERT INTO employees (
          employee_code, full_name, date_of_birth, gender, phone, email, address, hire_date, position, skill_level, status, user_id, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.userId ?? null,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    await query(
      `
        UPDATE employees
        SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?, address = ?, hire_date = ?, position = ?, skill_level = ?, status = ?, user_id = ?
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
        data.userId ?? null,
        id,
      ]
    );
    return this.findById(id);
  },

  async getActivePrimaryAssignment() {
    return null;
  },

  async assignToLine() {
    return 0;
  },

  async getAssignmentHistory() {
    return [];
  },

  async endActiveAssignment() {},
};
