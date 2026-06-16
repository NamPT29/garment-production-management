import { query } from '../../config/database.js';

const allowedSortFields = new Set(['material_code', 'material_name', 'minimum_stock', 'created_at', 'updated_at']);

const mapMaterial = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    materialCode: row.material_code,
    materialName: row.material_name,
    category: row.category,
    unit: row.unit,
    color: row.color,
    specification: row.specification,
    minimumStock: Number(row.minimum_stock ?? 0),
    defaultSupplierId: row.default_supplier_id,
    defaultSupplier: row.default_supplier_id
      ? {
          id: row.default_supplier_id,
          supplierCode: row.supplier_code,
          supplierName: row.supplier_name,
        }
      : null,
    notes: row.notes,
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalStock: Number(row.total_stock ?? 0),
  };
};

const buildListWhere = ({ search, category, supplierId, isActive, lowStock }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(
      '(materials.material_code LIKE ? OR materials.material_name LIKE ? OR materials.color LIKE ? OR materials.specification LIKE ?)',
    );
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (category) {
    conditions.push('materials.category = ?');
    params.push(category);
  }

  if (supplierId !== undefined) {
    conditions.push('materials.default_supplier_id = ?');
    params.push(supplierId);
  }

  if (isActive !== undefined) {
    conditions.push('materials.is_active = ?');
    params.push(isActive);
  }

  if (lowStock === true) {
    conditions.push('COALESCE(ib.total_stock, 0) <= materials.minimum_stock');
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

export const materialRepository = {
  async findMany(filters) {
    const {
      page,
      limit,
      skip,
      search,
      category,
      supplierId,
      isActive,
      lowStock,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const { whereSql, params } = buildListWhere({ search, category, supplierId, isActive, lowStock });
    const safeSortBy = allowedSortFields.has(sortBy) ? `materials.${sortBy}` : 'materials.created_at';
    const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT 
          materials.*,
          suppliers.supplier_code,
          suppliers.supplier_name,
          COALESCE(ib.total_stock, 0) AS total_stock
        FROM materials
        LEFT JOIN suppliers ON suppliers.id = materials.default_supplier_id
        LEFT JOIN (
          SELECT material_id, SUM(quantity_on_hand) AS total_stock
          FROM inventory_balances
          GROUP BY material_id
        ) AS ib ON ib.material_id = materials.id
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM materials
        LEFT JOIN (
          SELECT material_id, SUM(quantity_on_hand) AS total_stock
          FROM inventory_balances
          GROUP BY material_id
        ) AS ib ON ib.material_id = materials.id
        ${whereSql}
      `,
      params,
    );

    return {
      items: rows.map(mapMaterial),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query(
      `
        SELECT 
          materials.*,
          suppliers.supplier_code,
          suppliers.supplier_name,
          COALESCE(ib.total_stock, 0) AS total_stock
        FROM materials
        LEFT JOIN suppliers ON suppliers.id = materials.default_supplier_id
        LEFT JOIN (
          SELECT material_id, SUM(quantity_on_hand) AS total_stock
          FROM inventory_balances
          WHERE material_id = ?
          GROUP BY material_id
        ) AS ib ON ib.material_id = materials.id
        WHERE materials.id = ?
        LIMIT 1
      `,
      [id, id],
    );

    const material = mapMaterial(rows[0]);
    if (!material) {
      return null;
    }

    // Load warehouse balances
    const balanceRows = await query(
      `
        SELECT 
          ib.warehouse_id AS warehouseId,
          w.warehouse_code AS warehouseCode,
          w.warehouse_name AS warehouseName,
          ib.quantity_on_hand AS quantityOnHand
        FROM inventory_balances ib
        INNER JOIN warehouses w ON w.id = ib.warehouse_id
        WHERE ib.material_id = ?
      `,
      [id],
    );

    material.balances = balanceRows.map((row) => ({
      warehouseId: row.warehouseId,
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      quantityOnHand: Number(row.quantityOnHand ?? 0),
    }));

    return material;
  },

  async findActiveById(id) {
    const material = await this.findById(id);
    if (material && material.isActive) {
      return material;
    }
    return null;
  },

  async findActiveByIds(ids) {
    if (!ids.length) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
      `
        SELECT 
          materials.*,
          suppliers.supplier_code,
          suppliers.supplier_name,
          COALESCE(ib.total_stock, 0) AS total_stock
        FROM materials
        LEFT JOIN suppliers ON suppliers.id = materials.default_supplier_id
        LEFT JOIN (
          SELECT material_id, SUM(quantity_on_hand) AS total_stock
          FROM inventory_balances
          GROUP BY material_id
        ) AS ib ON ib.material_id = materials.id
        WHERE materials.id IN (${placeholders}) AND materials.is_active = TRUE
      `,
      ids,
    );
    return rows.map(mapMaterial);
  },

  async findByCode(materialCode) {
    const rows = await query('SELECT * FROM materials WHERE material_code = ? LIMIT 1', [materialCode]);
    return mapMaterial(rows[0]);
  },

  async create(data) {
    const result = await query(
      `
        INSERT INTO materials
          (material_code, material_name, category, unit, color, specification, minimum_stock, default_supplier_id, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.materialCode,
        data.materialName,
        data.category,
        data.unit,
        data.color ?? null,
        data.specification ?? null,
        data.minimumStock ?? 0,
        data.defaultSupplierId ?? null,
        data.notes ?? null,
        data.createdBy,
      ],
    );

    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fieldMap = {
      materialCode: 'material_code',
      materialName: 'material_name',
      category: 'category',
      unit: 'unit',
      color: 'color',
      specification: 'specification',
      minimumStock: 'minimum_stock',
      defaultSupplierId: 'default_supplier_id',
      notes: 'notes',
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
      await query(`UPDATE materials SET ${assignments.join(', ')} WHERE id = ?`, [...params, id]);
    }
    return this.findById(id);
  },

  async deactivate(id) {
    await query('UPDATE materials SET is_active = FALSE WHERE id = ?', [id]);
    return this.findById(id);
  },
};
