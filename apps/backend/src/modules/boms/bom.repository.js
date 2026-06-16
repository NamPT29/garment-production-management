import { query, transaction } from '../../config/database.js';

const allowedSortFields = new Set(['version', 'status', 'effective_date', 'created_at', 'updated_at']);
const toDateString = (value) => new Date(value).toISOString().slice(0, 10);

const mapBomRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    productId: row.product_id,
    product: {
      id: row.product_id,
      productCode: row.product_code,
      productName: row.product_name,
      category: row.category,
      unit: row.unit,
    },
    version: row.version,
    status: row.status,
    effectiveDate: toDateString(row.effective_date),
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildListWhere = ({ search, productId, status }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(p.product_code LIKE ? OR p.product_name LIKE ? OR boms.version LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (productId !== undefined) {
    conditions.push('boms.product_id = ?');
    params.push(productId);
  }
  if (status) {
    conditions.push('boms.status = ?');
    params.push(status);
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

export const bomRepository = {
  async findMany(filters) {
    const { page, limit, skip, search, productId, status, sortBy = 'created_at', sortOrder = 'DESC' } = filters;
    const { whereSql, params } = buildListWhere({ search, productId, status });
    const safeSortBy = allowedSortFields.has(sortBy) ? `boms.${sortBy}` : 'boms.created_at';
    const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT 
          boms.*,
          p.product_code,
          p.product_name,
          p.category,
          p.unit
        FROM boms
        INNER JOIN products p ON p.id = boms.product_id
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM boms
        INNER JOIN products p ON p.id = boms.product_id
        ${whereSql}
      `,
      params,
    );

    return {
      items: rows.map(mapBomRow),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query(
      `
        SELECT 
          boms.*,
          p.product_code,
          p.product_name,
          p.category,
          p.unit
        FROM boms
        INNER JOIN products p ON p.id = boms.product_id
        WHERE boms.id = ?
        LIMIT 1
      `,
      [id],
    );

    const bom = mapBomRow(rows[0]);
    if (!bom) {
      return null;
    }

    const itemRows = await query(
      `
        SELECT 
          bi.*,
          m.material_code,
          m.material_name,
          m.category AS material_category,
          m.unit AS material_unit,
          m.color AS material_color,
          m.specification AS material_specification
        FROM bom_items bi
        INNER JOIN materials m ON m.id = bi.material_id
        WHERE bi.bom_id = ?
        ORDER BY bi.id ASC
      `,
      [id],
    );

    bom.items = itemRows.map((row) => ({
      id: row.id,
      bomId: row.bom_id,
      materialId: row.material_id,
      quantityPerUnit: Number(row.quantity_per_unit),
      wasteRatePercent: Number(row.waste_rate_percent),
      notes: row.notes,
      material: {
        id: row.material_id,
        materialCode: row.material_code,
        materialName: row.material_name,
        category: row.material_category,
        unit: row.material_unit,
        color: row.material_color,
        specification: row.material_specification,
      },
    }));

    return bom;
  },

  async findByProductAndVersion(productId, version) {
    const rows = await query('SELECT id FROM boms WHERE product_id = ? AND version = ? LIMIT 1', [productId, version]);
    return rows[0] ?? null;
  },

  async findActiveByProductId(productId) {
    const rows = await query('SELECT id FROM boms WHERE product_id = ? AND status = \'ACTIVE\' LIMIT 1', [productId]);
    if (rows[0]) {
      return this.findById(rows[0].id);
    }
    return null;
  },

  async findManyByProductId(productId) {
    const rows = await query(
      `
        SELECT 
          boms.*,
          p.product_code,
          p.product_name,
          p.category,
          p.unit
        FROM boms
        INNER JOIN products p ON p.id = boms.product_id
        WHERE boms.product_id = ?
        ORDER BY boms.version DESC
      `,
      [productId],
    );
    return rows.map(mapBomRow);
  },

  async create({ bom, items, userId }) {
    return transaction(async (connection) => {
      const [result] = await connection.execute(
        `
          INSERT INTO boms
            (product_id, version, status, effective_date, notes, created_by, updated_by)
          VALUES (?, ?, 'DRAFT', ?, ?, ?, ?)
        `,
        [
          bom.productId,
          bom.version,
          toDateString(bom.effectiveDate),
          bom.notes ?? null,
          userId,
          userId,
        ],
      );
      const bomId = result.insertId;

      for (const item of items) {
        await connection.execute(
          `
            INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, waste_rate_percent, notes)
            VALUES (?, ?, ?, ?, ?)
          `,
          [
            bomId,
            item.materialId,
            item.quantityPerUnit,
            item.wasteRatePercent ?? 0,
            item.notes ?? null,
          ],
        );
      }

      return bomId;
    });
  },

  async update({ bomId, bom, items, userId }) {
    return transaction(async (connection) => {
      const fieldMap = {
        version: 'version',
        effectiveDate: 'effective_date',
        notes: 'notes',
      };
      const assignments = [];
      const params = [];

      for (const [key, column] of Object.entries(fieldMap)) {
        if (Object.prototype.hasOwnProperty.call(bom, key)) {
          assignments.push(`${column} = ?`);
          const value = key === 'effectiveDate' ? toDateString(bom[key]) : bom[key];
          params.push(value ?? null);
        }
      }
      assignments.push('updated_by = ?');
      params.push(userId);

      await connection.execute(`UPDATE boms SET ${assignments.join(', ')} WHERE id = ?`, [
        ...params,
        bomId,
      ]);

      if (items) {
        await connection.execute('DELETE FROM bom_items WHERE bom_id = ?', [bomId]);
        for (const item of items) {
          await connection.execute(
            `
              INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, waste_rate_percent, notes)
              VALUES (?, ?, ?, ?, ?)
            `,
            [
              bomId,
              item.materialId,
              item.quantityPerUnit,
              item.wasteRatePercent ?? 0,
              item.notes ?? null,
            ],
          );
        }
      }
    });
  },

  async activate(bomId) {
    return transaction(async (connection) => {
      const [bomRows] = await connection.execute('SELECT product_id FROM boms WHERE id = ? LIMIT 1', [bomId]);
      const bom = bomRows[0];
      if (!bom) {
        return;
      }
      // Set all other active BOMs of the product to INACTIVE
      await connection.execute('UPDATE boms SET status = \'INACTIVE\' WHERE product_id = ? AND status = \'ACTIVE\'', [
        bom.product_id,
      ]);
      // Set this BOM to ACTIVE
      await connection.execute('UPDATE boms SET status = \'ACTIVE\' WHERE id = ?', [bomId]);
    });
  },

  async deactivate(bomId) {
    await query('UPDATE boms SET status = \'INACTIVE\' WHERE id = ?', [bomId]);
  },
};
