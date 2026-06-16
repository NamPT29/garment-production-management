import { query } from '../../config/database.js';

const mapOperation = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    operationCode: row.operation_code,
    operationName: row.operation_name,
    description: row.description,
    standardTimeSeconds: Number(row.standard_time_seconds ?? 0),
    difficultyLevel: row.difficulty_level,
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapProductOperation = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    operationId: row.operation_id,
    sequenceNumber: Number(row.sequence_number ?? 0),
    standardTimeSeconds: Number(row.standard_time_seconds ?? 0),
    requiredSkillLevel: row.required_skill_level,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Joined fields
    operationCode: row.operation_code,
    operationName: row.operation_name,
    difficultyLevel: row.difficulty_level,
  };
};

export const operationRepository = {
  async findAll(filters = {}) {
    const { isActive, search } = filters;
    const conditions = [];
    const params = [];

    if (isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(isActive);
    }
    if (search) {
      conditions.push('(operation_code LIKE ? OR operation_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT * FROM operations
        ${whereSql}
        ORDER BY operation_code ASC
      `,
      params
    );
    return rows.map(mapOperation);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM operations WHERE id = ? LIMIT 1', [id]);
    return mapOperation(rows[0]);
  },

  async findByCode(code) {
    const rows = await query('SELECT * FROM operations WHERE operation_code = ? LIMIT 1', [code]);
    return mapOperation(rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `
        INSERT INTO operations (operation_code, operation_name, description, standard_time_seconds, difficulty_level, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.operationCode,
        data.operationName,
        data.description ?? null,
        data.standardTimeSeconds,
        data.difficultyLevel ?? 'MEDIUM',
        data.isActive ?? true,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    await query(
      `
        UPDATE operations
        SET operation_name = ?, description = ?, standard_time_seconds = ?, difficulty_level = ?, is_active = ?
        WHERE id = ?
      `,
      [data.operationName, data.description ?? null, data.standardTimeSeconds, data.difficultyLevel, data.isActive, id]
    );
    return this.findById(id);
  },

  // Product operations flow management
  async findProductOperations(productId) {
    const rows = await query(
      `
        SELECT po.*, o.operation_code, o.operation_name, o.difficulty_level
        FROM product_operations po
        INNER JOIN operations o ON o.id = po.operation_id
        WHERE po.product_id = ?
        ORDER BY po.sequence_number ASC
      `,
      [productId]
    );
    return rows.map(mapProductOperation);
  },

  async findProductOperationById(productOpId) {
    const rows = await query(
      `
        SELECT po.*, o.operation_code, o.operation_name, o.difficulty_level
        FROM product_operations po
        INNER JOIN operations o ON o.id = po.operation_id
        WHERE po.id = ?
        LIMIT 1
      `,
      [productOpId]
    );
    return mapProductOperation(rows[0]);
  },

  async addProductOperation(data) {
    const result = await query(
      `
        INSERT INTO product_operations (product_id, operation_id, sequence_number, standard_time_seconds, required_skill_level, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.productId,
        data.operationId,
        data.sequenceNumber,
        data.standardTimeSeconds,
        data.requiredSkillLevel ?? 'BEGINNER',
        data.notes ?? null,
      ]
    );
    return result.insertId;
  },

  async updateProductOperation(productOpId, data) {
    await query(
      `
        UPDATE product_operations
        SET sequence_number = ?, standard_time_seconds = ?, required_skill_level = ?, notes = ?
        WHERE id = ?
      `,
      [data.sequenceNumber, data.standardTimeSeconds, data.requiredSkillLevel, data.notes ?? null, productOpId]
    );
    return this.findProductOperationById(productOpId);
  },

  async removeProductOperation(productOpId) {
    await query('DELETE FROM product_operations WHERE id = ?', [productOpId]);
  },

  async checkProductSequenceExists(productId, sequenceNumber) {
    const rows = await query(
      'SELECT id FROM product_operations WHERE product_id = ? AND sequence_number = ? LIMIT 1',
      [productId, sequenceNumber]
    );
    return rows[0] ?? null;
  },

  async checkProductOperationExists(productId, operationId) {
    const rows = await query(
      'SELECT id FROM product_operations WHERE product_id = ? AND operation_id = ? LIMIT 1',
      [productId, operationId]
    );
    return rows[0] ?? null;
  },
};
