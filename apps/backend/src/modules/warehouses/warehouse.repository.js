import { query } from '../../config/database.js';

const allowedSortFields = new Set(['warehouse_code', 'warehouse_name', 'created_at', 'updated_at']);

const stockSql = `
  SELECT
    it.warehouse_id,
    iti.material_id,
    SUM(
      CASE
        WHEN it.transaction_type IN ('RECEIPT', 'ADJUSTMENT_IN') THEN iti.quantity
        WHEN it.transaction_type IN ('ISSUE', 'ADJUSTMENT_OUT') THEN -iti.quantity
        ELSE 0
      END
    ) AS quantity_on_hand,
    MAX(it.updated_at) AS updated_at
  FROM inventory_transactions it
  INNER JOIN inventory_transaction_items iti ON iti.inventory_transaction_id = it.id
  WHERE it.status = 'POSTED'
  GROUP BY it.warehouse_id, iti.material_id
`;

const mapWarehouse = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    warehouseCode: row.warehouse_code,
    warehouseName: row.warehouse_name,
    location: row.location,
    description: row.description,
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildListWhere = ({ search, isActive }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(
      '(warehouse_code LIKE ? OR warehouse_name LIKE ? OR location LIKE ?)',
    );
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (isActive !== undefined) {
    conditions.push('is_active = ?');
    params.push(isActive);
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

export const warehouseRepository = {
  async findMany(filters) {
    const { page, limit, skip, search, isActive, sortBy = 'created_at', sortOrder = 'DESC' } = filters;
    const { whereSql, params } = buildListWhere({ search, isActive });
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT *
        FROM warehouses
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );
    const countRows = await query(`SELECT COUNT(*) AS total FROM warehouses ${whereSql}`, params);

    return {
      items: rows.map(mapWarehouse),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query('SELECT * FROM warehouses WHERE id = ? LIMIT 1', [id]);
    return mapWarehouse(rows[0]);
  },

  async findActiveById(id) {
    const rows = await query('SELECT * FROM warehouses WHERE id = ? AND is_active = TRUE LIMIT 1', [id]);
    return mapWarehouse(rows[0]);
  },

  async findByCode(warehouseCode) {
    const rows = await query('SELECT * FROM warehouses WHERE warehouse_code = ? LIMIT 1', [warehouseCode]);
    return mapWarehouse(rows[0]);
  },

  async hasTransactions(id) {
    const rows = await query('SELECT COUNT(*) AS total FROM inventory_transactions WHERE warehouse_id = ? LIMIT 1', [id]);
    return rows[0].total > 0;
  },

  async findBalances(warehouseId, filters) {
    const { page, limit, skip, search, category, lowStock } = filters;
    const conditions = ['stock.warehouse_id = ?'];
    const params = [warehouseId];

    if (search) {
      conditions.push('(m.material_code LIKE ? OR m.material_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (category) {
      conditions.push('m.category = ?');
      params.push(category);
    }
    if (lowStock === true) {
      conditions.push('COALESCE(stock.quantity_on_hand, 0) <= m.minimum_stock');
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT
          stock.warehouse_id,
          stock.material_id,
          COALESCE(stock.quantity_on_hand, 0) AS quantity_on_hand,
          stock.updated_at,
          m.material_code,
          m.material_name,
          m.category,
          m.unit,
          m.minimum_stock
        FROM (${stockSql}) stock
        INNER JOIN materials m ON m.id = stock.material_id
        ${whereSql}
        ORDER BY m.material_code ASC
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM (${stockSql}) stock
        INNER JOIN materials m ON m.id = stock.material_id
        ${whereSql}
      `,
      params,
    );

    return {
      items: rows.map((row) => ({
        id: row.material_id,
        warehouseId: row.warehouse_id,
        materialId: row.material_id,
        quantityOnHand: Number(row.quantity_on_hand ?? 0),
        updatedAt: row.updated_at,
        material: {
          id: row.material_id,
          materialCode: row.material_code,
          materialName: row.material_name,
          category: row.category,
          unit: row.unit,
          minimumStock: Number(row.minimum_stock ?? 0),
          lowStock: Number(row.quantity_on_hand ?? 0) <= Number(row.minimum_stock ?? 0),
        },
      })),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async create(data) {
    const result = await query(
      `
        INSERT INTO warehouses
          (warehouse_code, warehouse_name, location, description, created_by)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.warehouseCode,
        data.warehouseName,
        data.location ?? null,
        data.description ?? null,
        data.createdBy,
      ],
    );

    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fieldMap = {
      warehouseCode: 'warehouse_code',
      warehouseName: 'warehouse_name',
      location: 'location',
      description: 'description',
    };
    const assignments = [];
    const params = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        assignments.push(`${column} = ?`);
        params.push(data[key] ?? null);
      }
    }

    if (assignments.length > 0) {
      await query(`UPDATE warehouses SET ${assignments.join(', ')} WHERE id = ?`, [...params, id]);
    }
    return this.findById(id);
  },

  async deactivate(id) {
    await query('UPDATE warehouses SET is_active = FALSE WHERE id = ?', [id]);
    return this.findById(id);
  },
};
