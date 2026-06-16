import { query } from '../../config/database.js';

const allowedSortFields = new Set([
  'product_code',
  'product_name',
  'category',
  'created_at',
  'updated_at',
]);

const mapProduct = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    productCode: row.product_code,
    productName: row.product_name,
    category: row.category,
    unit: row.unit,
    description: row.description,
    standardTimeMinutes: row.standard_time_minutes,
    imageUrl: row.image_url,
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildListWhere = ({ search, category, isActive }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(product_code LIKE ? OR product_name LIKE ? OR category LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (category) {
    conditions.push('category = ?');
    params.push(category);
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

export const productRepository = {
  async findMany(filters) {
    const {
      page,
      limit,
      skip,
      search,
      category,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;
    const { whereSql, params } = buildListWhere({ search, category, isActive });
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);
    const rows = await query(
      `
        SELECT *
        FROM products
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );
    const countRows = await query(`SELECT COUNT(*) AS total FROM products ${whereSql}`, params);

    return {
      items: rows.map(mapProduct),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    return mapProduct(rows[0]);
  },

  async findActiveByIds(ids) {
    if (!ids.length) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
      `SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = TRUE`,
      ids,
    );
    return rows.map(mapProduct);
  },

  async create(data) {
    const result = await query(
      `
        INSERT INTO products
          (product_code, product_name, category, unit, description, standard_time_minutes, image_url, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.productCode,
        data.productName,
        data.category ?? null,
        data.unit ?? null,
        data.description ?? null,
        data.standardTimeMinutes ?? null,
        data.imageUrl || null,
        data.createdBy,
      ],
    );

    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fieldMap = {
      productCode: 'product_code',
      productName: 'product_name',
      category: 'category',
      unit: 'unit',
      description: 'description',
      standardTimeMinutes: 'standard_time_minutes',
      imageUrl: 'image_url',
    };
    const assignments = [];
    const params = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        assignments.push(`${column} = ?`);
        params.push(key === 'imageUrl' ? data[key] || null : data[key] ?? null);
      }
    }

    await query(`UPDATE products SET ${assignments.join(', ')} WHERE id = ?`, [...params, id]);
    return this.findById(id);
  },

  async deactivate(id) {
    await query('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
    return this.findById(id);
  },
};
