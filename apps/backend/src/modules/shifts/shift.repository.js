import { query } from '../../config/database.js';

const mapShift = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    shiftCode: row.shift_code,
    shiftName: row.shift_name,
    startTime: row.start_time,
    endTime: row.end_time,
    breakMinutes: Number(row.break_minutes ?? 0),
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const shiftRepository = {
  async findAll(filters = {}) {
    const { isActive, search } = filters;
    const conditions = [];
    const params = [];

    if (isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(isActive);
    }
    if (search) {
      conditions.push('(shift_code LIKE ? OR shift_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT * FROM shifts
        ${whereSql}
        ORDER BY shift_code ASC
      `,
      params
    );
    return rows.map(mapShift);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM shifts WHERE id = ? LIMIT 1', [id]);
    return mapShift(rows[0]);
  },

  async findByCode(code) {
    const rows = await query('SELECT * FROM shifts WHERE shift_code = ? LIMIT 1', [code]);
    return mapShift(rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `
        INSERT INTO shifts (shift_code, shift_name, start_time, end_time, break_minutes, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.shiftCode,
        data.shiftName,
        data.startTime,
        data.endTime,
        data.breakMinutes ?? 0,
        data.isActive ?? true,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    await query(
      `
        UPDATE shifts
        SET shift_name = ?, start_time = ?, end_time = ?, break_minutes = ?, is_active = ?
        WHERE id = ?
      `,
      [data.shiftName, data.startTime, data.endTime, data.breakMinutes, data.isActive, id]
    );
    return this.findById(id);
  },
};
