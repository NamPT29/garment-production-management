import { query, transaction } from '../../config/database.js';

const allowedSortFields = new Set([
  'order_code',
  'order_date',
  'expected_delivery_date',
  'priority',
  'status',
  'created_at',
]);

const toDateString = (value) => new Date(value).toISOString().slice(0, 10);

const mapOrderListRow = (row) => ({
  id: row.id,
  orderCode: row.order_code,
  customer: {
    id: row.customer_id,
    customerCode: row.customer_code,
    customerName: row.customer_name,
  },
  orderDate: row.order_date,
  expectedDeliveryDate: row.expected_delivery_date,
  priority: row.priority,
  status: row.status,
  totalItemTypes: Number(row.total_item_types ?? 0),
  totalQuantity: Number(row.total_quantity ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapOrderBase = (row) => ({
  id: row.id,
  orderCode: row.order_code,
  customerId: row.customer_id,
  orderDate: row.order_date,
  expectedDeliveryDate: row.expected_delivery_date,
  priority: row.priority,
  status: row.status,
  notes: row.notes,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildListWhere = (filters) => {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(orders.order_code LIKE ? OR customers.customer_name LIKE ? OR customers.customer_code LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }
  if (filters.status) {
    conditions.push('orders.status = ?');
    params.push(filters.status);
  }
  if (filters.priority) {
    conditions.push('orders.priority = ?');
    params.push(filters.priority);
  }
  if (filters.customerId) {
    conditions.push('orders.customer_id = ?');
    params.push(filters.customerId);
  }
  if (filters.deliveryFrom) {
    conditions.push('orders.expected_delivery_date >= ?');
    params.push(toDateString(filters.deliveryFrom));
  }
  if (filters.deliveryTo) {
    conditions.push('orders.expected_delivery_date <= ?');
    params.push(toDateString(filters.deliveryTo));
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

export const orderRepository = {
  async findMany(filters) {
    const { whereSql, params } = buildListWhere(filters);
    const safeSortBy = allowedSortFields.has(filters.sortBy) ? filters.sortBy : 'created_at';
    const safeSortOrder = String(filters.sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(filters.limit);
    const safeSkip = Number(filters.skip);
    const rows = await query(
      `
        SELECT
          orders.*,
          customers.customer_code,
          customers.customer_name,
          COALESCE(order_totals.total_item_types, 0) AS total_item_types,
          COALESCE(order_totals.total_quantity, 0) AS total_quantity
        FROM orders
        INNER JOIN customers ON customers.id = orders.customer_id
        LEFT JOIN (
          SELECT order_id, COUNT(id) AS total_item_types, SUM(quantity) AS total_quantity
          FROM order_items
          GROUP BY order_id
        ) AS order_totals ON order_totals.order_id = orders.id
        ${whereSql}
        ORDER BY orders.${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );
    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM orders
        INNER JOIN customers ON customers.id = orders.customer_id
        ${whereSql}
      `,
      params,
    );

    return {
      items: rows.map(mapOrderListRow),
      total: countRows[0].total,
      page: filters.page,
      limit: filters.limit,
    };
  },

  async findById(id) {
    const rows = await query(
      `
        SELECT
          orders.*,
          customers.customer_code,
          customers.customer_name,
          customers.contact_person,
          customers.phone,
          customers.email
        FROM orders
        INNER JOIN customers ON customers.id = orders.customer_id
        WHERE orders.id = ?
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  },

  async findDetail(id) {
    const orderRows = await query(
      `
        SELECT
          orders.*,
          customers.customer_code,
          customers.customer_name,
          customers.contact_person,
          customers.phone,
          customers.email
        FROM orders
        INNER JOIN customers ON customers.id = orders.customer_id
        WHERE orders.id = ?
        LIMIT 1
      `,
      [id],
    );

    const row = orderRows[0];
    if (!row) {
      return null;
    }

    const itemRows = await query(
      `
        SELECT
          order_items.*,
          products.product_code,
          products.product_name,
          products.category,
          products.unit
        FROM order_items
        INNER JOIN products ON products.id = order_items.product_id
        WHERE order_items.order_id = ?
        ORDER BY order_items.id ASC
      `,
      [id],
    );
    const historyRows = await this.findStatusHistory(id);

    return {
      ...mapOrderBase(row),
      customer: {
        id: row.customer_id,
        customerCode: row.customer_code,
        customerName: row.customer_name,
        contactPerson: row.contact_person,
        phone: row.phone,
        email: row.email,
      },
      items: itemRows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        color: item.color,
        size: item.size,
        notes: item.notes,
        product: {
          id: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          category: item.category,
          unit: item.unit,
        },
      })),
      statusHistory: historyRows,
    };
  },

  async findStatusHistory(orderId) {
    const rows = await query(
      `
        SELECT
          order_status_histories.*,
          users.username AS changed_by_username
        FROM order_status_histories
        LEFT JOIN users ON users.id = order_status_histories.changed_by
        WHERE order_status_histories.order_id = ?
        ORDER BY order_status_histories.created_at ASC, order_status_histories.id ASC
      `,
      [orderId],
    );

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      changedBy: row.changed_by,
      changedByUsername: row.changed_by_username,
      changeNote: row.change_note,
      createdAt: row.created_at,
    }));
  },

  async create({ order, items, userId }) {
    return transaction(async (connection) => {
      const [result] = await connection.execute(
        `
          INSERT INTO orders
            (order_code, customer_id, order_date, expected_delivery_date, priority, status, notes, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?)
        `,
        [
          order.orderCode,
          order.customerId,
          toDateString(order.orderDate),
          toDateString(order.expectedDeliveryDate),
          order.priority,
          order.notes ?? null,
          userId,
          userId,
        ],
      );
      const orderId = result.insertId;

      for (const item of items) {
        await connection.execute(
          `
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, color, size, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            orderId,
            item.productId,
            item.quantity,
            item.unitPrice ?? 0,
            item.color ?? null,
            item.size ?? null,
            item.notes ?? null,
          ],
        );
      }

      await connection.execute(
        `
          INSERT INTO order_status_histories (order_id, from_status, to_status, changed_by, change_note)
          VALUES (?, NULL, 'DRAFT', ?, ?)
        `,
        [orderId, userId, 'Tao don hang'],
      );

      return orderId;
    });
  },

  async update({ orderId, order, items, userId }) {
    return transaction(async (connection) => {
      const fieldMap = {
        customerId: 'customer_id',
        orderDate: 'order_date',
        expectedDeliveryDate: 'expected_delivery_date',
        priority: 'priority',
        notes: 'notes',
      };
      const assignments = [];
      const params = [];

      for (const [key, column] of Object.entries(fieldMap)) {
        if (Object.prototype.hasOwnProperty.call(order, key)) {
          assignments.push(`${column} = ?`);
          const value = key.endsWith('Date') ? toDateString(order[key]) : order[key];
          params.push(value ?? null);
        }
      }
      assignments.push('updated_by = ?');
      params.push(userId);

      await connection.execute(`UPDATE orders SET ${assignments.join(', ')} WHERE id = ?`, [
        ...params,
        orderId,
      ]);

      if (items) {
        await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
          await connection.execute(
            `
              INSERT INTO order_items (order_id, product_id, quantity, unit_price, color, size, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
              orderId,
              item.productId,
              item.quantity,
              item.unitPrice ?? 0,
              item.color ?? null,
              item.size ?? null,
              item.notes ?? null,
            ],
          );
        }
      }
    });
  },

  async updateStatus({ orderId, fromStatus, toStatus, changeNote, userId }) {
    return transaction(async (connection) => {
      await connection.execute('UPDATE orders SET status = ?, updated_by = ? WHERE id = ?', [
        toStatus,
        userId,
        orderId,
      ]);
      await connection.execute(
        `
          INSERT INTO order_status_histories (order_id, from_status, to_status, changed_by, change_note)
          VALUES (?, ?, ?, ?, ?)
        `,
        [orderId, fromStatus, toStatus, userId, changeNote ?? null],
      );
    });
  },

  async summary() {
    const totals = await query(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(status = 'IN_PRODUCTION') AS inProduction,
        SUM(status = 'DELIVERED') AS delivered,
        SUM(expected_delivery_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status NOT IN ('DELIVERED', 'CANCELLED')) AS dueSoon
      FROM orders
    `);
    const byStatus = await query(`
      SELECT status, COUNT(*) AS total
      FROM orders
      GROUP BY status
      ORDER BY status ASC
    `);

    return {
      totalOrders: Number(totals[0].totalOrders ?? 0),
      inProduction: Number(totals[0].inProduction ?? 0),
      delivered: Number(totals[0].delivered ?? 0),
      dueSoon: Number(totals[0].dueSoon ?? 0),
      byStatus: byStatus.map((row) => ({ status: row.status, total: Number(row.total) })),
    };
  },
};
