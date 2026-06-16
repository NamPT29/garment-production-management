import { query } from '../../config/database.js';

const toDateString = (val) => (val ? new Date(val).toISOString().slice(0, 10) : null);

const mapProductionOrder = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    productionOrderCode: row.production_order_code,
    orderId: row.order_id,
    orderCode: row.order_code, // Joined field
    productId: row.product_id,
    productCode: row.product_code, // Joined field
    productName: row.product_name, // Joined field
    plannedQuantity: Number(row.planned_quantity ?? 0),
    completedQuantity: Number(row.completed_quantity ?? 0),
    rejectedQuantity: Number(row.rejected_quantity ?? 0),
    plannedStartDate: toDateString(row.planned_start_date),
    plannedEndDate: toDateString(row.planned_end_date),
    actualStartDate: toDateString(row.actual_start_date),
    actualEndDate: toDateString(row.actual_end_date),
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const productionOrderRepository = {
  async findMany(filters = {}) {
    const { status, priority, productId, orderId, search, page = 1, limit = 50, skip = 0 } = filters;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('po.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('po.priority = ?');
      params.push(priority);
    }
    if (productId !== undefined) {
      conditions.push('po.product_id = ?');
      params.push(productId);
    }
    if (orderId !== undefined) {
      conditions.push('po.order_id = ?');
      params.push(orderId);
    }
    if (search) {
      conditions.push('(po.production_order_code LIKE ? OR o.order_code LIKE ? OR p.product_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT po.*, o.order_code, p.product_code, p.product_name
        FROM production_orders po
        INNER JOIN orders o ON o.id = po.order_id
        INNER JOIN products p ON p.id = po.product_id
        ${whereSql}
        ORDER BY po.id DESC
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM production_orders po
        INNER JOIN orders o ON o.id = po.order_id
        INNER JOIN products p ON p.id = po.product_id
        ${whereSql}
      `,
      params
    );

    return {
      items: rows.map(mapProductionOrder),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findById(id) {
    const rows = await query(
      `
        SELECT po.*, o.order_code, p.product_code, p.product_name
        FROM production_orders po
        INNER JOIN orders o ON o.id = po.order_id
        INNER JOIN products p ON p.id = po.product_id
        WHERE po.id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapProductionOrder(rows[0]);
  },

  async findByCode(code) {
    const rows = await query(
      `
        SELECT po.*, o.order_code, p.product_code, p.product_name
        FROM production_orders po
        INNER JOIN orders o ON o.id = po.order_id
        INNER JOIN products p ON p.id = po.product_id
        WHERE po.production_order_code = ?
        LIMIT 1
      `,
      [code]
    );
    return mapProductionOrder(rows[0]);
  },

  async create(data, userId) {
    const result = await query(
      `
        INSERT INTO production_orders (
          production_order_code, order_id, product_id, planned_quantity, completed_quantity, rejected_quantity, 
          planned_start_date, planned_end_date, priority, status, notes, created_by, updated_by
        )
        VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.productionOrderCode,
        data.orderId,
        data.productId,
        data.plannedQuantity,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.priority ?? 'NORMAL',
        data.status ?? 'DRAFT',
        data.notes ?? null,
        userId,
        userId,
      ]
    );
    return result.insertId;
  },

  async update(id, data, userId) {
    await query(
      `
        UPDATE production_orders
        SET planned_quantity = ?, planned_start_date = ?, planned_end_date = ?, priority = ?, status = ?, notes = ?, updated_by = ?
        WHERE id = ?
      `,
      [
        data.plannedQuantity,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.priority,
        data.status,
        data.notes ?? null,
        userId,
        id,
      ]
    );
    return this.findById(id);
  },

  async updateStatus(id, status, userId) {
    await query(
      `
        UPDATE production_orders
        SET status = ?, updated_by = ?
        WHERE id = ?
      `,
      [status, userId, id]
    );
    return this.findById(id);
  },

  async getParentOrderItemQty(orderId, productId) {
    const rows = await query(
      `
        SELECT SUM(quantity) AS total_qty
        FROM order_items
        WHERE order_id = ? AND product_id = ?
      `,
      [orderId, productId]
    );
    return Number(rows[0]?.total_qty ?? 0);
  },

  async getSumOfOtherPlannedQuantities(orderId, productId, excludePoId = 0) {
    const rows = await query(
      `
        SELECT SUM(planned_quantity) AS total_planned
        FROM production_orders
        WHERE order_id = ? AND product_id = ? AND status != 'CANCELLED' AND id != ?
      `,
      [orderId, productId, excludePoId]
    );
    return Number(rows[0]?.total_planned ?? 0);
  },
};
