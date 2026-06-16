import { query } from '../../config/database.js';

const allowedSortFields = new Set(['supplier_code', 'supplier_name', 'created_at', 'updated_at']);

const mapSupplier = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    supplierCode: row.supplier_code,
    supplierName: row.supplier_name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    address: row.address,
    taxCode: row.tax_code,
    notes: row.notes,
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
      '(supplier_code LIKE ? OR supplier_name LIKE ? OR phone LIKE ? OR email LIKE ?)',
    );
    const like = `%${search}%`;
    params.push(like, like, like, like);
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

export const supplierRepository = {
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
        FROM suppliers
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );
    const countRows = await query(`SELECT COUNT(*) AS total FROM suppliers ${whereSql}`, params);

    return {
      items: rows.map(mapSupplier),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query('SELECT * FROM suppliers WHERE id = ? LIMIT 1', [id]);
    return mapSupplier(rows[0]);
  },

  async findActiveById(id) {
    const rows = await query('SELECT * FROM suppliers WHERE id = ? AND is_active = TRUE LIMIT 1', [id]);
    return mapSupplier(rows[0]);
  },

  async findByCode(supplierCode) {
    const rows = await query('SELECT * FROM suppliers WHERE supplier_code = ? LIMIT 1', [supplierCode]);
    return mapSupplier(rows[0]);
  },

  async isUsedAsDefault(id) {
    const rows = await query('SELECT COUNT(*) AS total FROM materials WHERE default_supplier_id = ? AND is_active = TRUE', [id]);
    return rows[0].total > 0;
  },

  async hasReceipts(id) {
    const rows = await query('SELECT COUNT(*) AS total FROM inventory_transactions WHERE supplier_id = ? LIMIT 1', [id]);
    return rows[0].total > 0;
  },

  async create(data) {
    const result = await query(
      `
        INSERT INTO suppliers
          (supplier_code, supplier_name, contact_person, phone, email, address, tax_code, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.supplierCode,
        data.supplierName,
        data.contactPerson ?? null,
        data.phone ?? null,
        data.email || null,
        data.address ?? null,
        data.taxCode ?? null,
        data.notes ?? null,
        data.createdBy,
      ],
    );

    return this.findById(result.insertId);
  },

  async update(id, data) {
    const fieldMap = {
      supplierCode: 'supplier_code',
      supplierName: 'supplier_name',
      contactPerson: 'contact_person',
      phone: 'phone',
      email: 'email',
      address: 'address',
      taxCode: 'tax_code',
      notes: 'notes',
    };
    const assignments = [];
    const params = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        assignments.push(`${column} = ?`);
        params.push(key === 'email' ? data[key] || null : data[key] ?? null);
      }
    }

    if (assignments.length > 0) {
      await query(`UPDATE suppliers SET ${assignments.join(', ')} WHERE id = ?`, [...params, id]);
    }
    return this.findById(id);
  },

  async deactivate(id) {
    await query('UPDATE suppliers SET is_active = FALSE WHERE id = ?', [id]);
    return this.findById(id);
  },
};
