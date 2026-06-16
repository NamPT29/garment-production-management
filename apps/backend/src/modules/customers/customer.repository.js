import { query } from '../../config/database.js';

const allowedSortFields = new Set(['customer_code', 'customer_name', 'created_at', 'updated_at']);

const mapCustomer = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
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
      '(customer_code LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR email LIKE ?)',
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

export const customerRepository = {
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
        FROM customers
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );
    const countRows = await query(`SELECT COUNT(*) AS total FROM customers ${whereSql}`, params);

    return {
      items: rows.map(mapCustomer),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query('SELECT * FROM customers WHERE id = ? LIMIT 1', [id]);
    return mapCustomer(rows[0]);
  },

  async findActiveById(id) {
    const rows = await query('SELECT * FROM customers WHERE id = ? AND is_active = TRUE LIMIT 1', [id]);
    return mapCustomer(rows[0]);
  },

  async findByCode(customerCode) {
    const rows = await query('SELECT * FROM customers WHERE customer_code = ? LIMIT 1', [customerCode]);
    return mapCustomer(rows[0]);
  },

  async create(data) {
    const result = await query(
      `
        INSERT INTO customers
          (customer_code, customer_name, contact_person, phone, email, address, tax_code, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.customerCode,
        data.customerName,
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
      customerCode: 'customer_code',
      customerName: 'customer_name',
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

    await query(`UPDATE customers SET ${assignments.join(', ')} WHERE id = ?`, [...params, id]);
    return this.findById(id);
  },

  async deactivate(id) {
    await query('UPDATE customers SET is_active = FALSE WHERE id = ?', [id]);
    return this.findById(id);
  },
};
