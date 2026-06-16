import { query } from '../../config/database.js';

const mapProductionLine = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    lineCode: row.line_code,
    lineName: row.line_name,
    location: row.location,
    targetWorkers: Number(row.target_workers ?? 0),
    maximumWorkers: Number(row.maximum_workers ?? 0),
    status: row.status,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const productionLineRepository = {
  async findAll(filters = {}) {
    const { status, search } = filters;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(line_code LIKE ? OR line_name LIKE ? OR location LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT * FROM production_lines
        ${whereSql}
        ORDER BY line_code ASC
      `,
      params
    );
    return rows.map(mapProductionLine);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM production_lines WHERE id = ? LIMIT 1', [id]);
    return mapProductionLine(rows[0]);
  },

  async findByCode(code) {
    const rows = await query('SELECT * FROM production_lines WHERE line_code = ? LIMIT 1', [code]);
    return mapProductionLine(rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `
        INSERT INTO production_lines (line_code, line_name, location, target_workers, maximum_workers, status, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.lineCode,
        data.lineName,
        data.location ?? null,
        data.targetWorkers ?? 0,
        data.maximumWorkers ?? 0,
        data.status ?? 'ACTIVE',
        data.description ?? null,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    await query(
      `
        UPDATE production_lines
        SET line_name = ?, location = ?, target_workers = ?, maximum_workers = ?, status = ?, description = ?
        WHERE id = ?
      `,
      [
        data.lineName,
        data.location ?? null,
        data.targetWorkers,
        data.maximumWorkers,
        data.status,
        data.description ?? null,
        id,
      ]
    );
    return this.findById(id);
  },

  async getActiveEmployees() {
    return [];
  },
};
