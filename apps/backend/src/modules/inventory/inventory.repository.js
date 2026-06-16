import { query, transaction } from '../../config/database.js';

const allowedBalanceSortFields = new Set(['quantity_on_hand', 'updated_at']);
const allowedTxSortFields = new Set(['transaction_code', 'transaction_date', 'created_at', 'updated_at']);
const toDateString = (value) => new Date(value).toISOString().slice(0, 10);

const mapBalance = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    warehouse: {
      id: row.warehouse_id,
      warehouseCode: row.warehouse_code,
      warehouseName: row.warehouse_name,
    },
    materialId: row.material_id,
    material: {
      id: row.material_id,
      materialCode: row.material_code,
      materialName: row.material_name,
      category: row.category,
      unit: row.unit,
      minimumStock: Number(row.minimum_stock ?? 0),
    },
    quantityOnHand: Number(row.quantity_on_hand ?? 0),
    lowStock: Number(row.quantity_on_hand ?? 0) <= Number(row.minimum_stock ?? 0),
    updatedAt: row.updated_at,
  };
};

const mapTxRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    transactionCode: row.transaction_code,
    transactionType: row.transaction_type,
    warehouseId: row.warehouse_id,
    warehouse: {
      id: row.warehouse_id,
      warehouseCode: row.warehouse_code,
      warehouseName: row.warehouse_name,
    },
    supplierId: row.supplier_id,
    supplier: row.supplier_id
      ? {
          id: row.supplier_id,
          supplierCode: row.supplier_code,
          supplierName: row.supplier_name,
        }
      : null,
    orderId: row.order_id,
    order: row.order_id
      ? {
          id: row.order_id,
          orderCode: row.order_code,
        }
      : null,
    transactionDate: toDateString(row.transaction_date),
    referenceNumber: row.reference_number,
    notes: row.notes,
    status: row.status,
    createdBy: row.created_by,
    createdByUser: {
      id: row.created_by,
      username: row.created_username,
      fullName: row.created_fullname,
    },
    postedBy: row.posted_by,
    postedByUser: row.posted_by
      ? {
          id: row.posted_by,
          username: row.posted_username,
          fullName: row.posted_fullname,
        }
      : null,
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const inventoryRepository = {
  async findBalances(filters) {
    const { page, limit, skip, search, warehouseId, materialId, category, lowStock, sortBy = 'updated_at', sortOrder = 'DESC' } = filters;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(m.material_code LIKE ? OR m.material_name LIKE ? OR w.warehouse_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (warehouseId !== undefined) {
      conditions.push('inventory_balances.warehouse_id = ?');
      params.push(warehouseId);
    }
    if (materialId !== undefined) {
      conditions.push('inventory_balances.material_id = ?');
      params.push(materialId);
    }
    if (category) {
      conditions.push('m.category = ?');
      params.push(category);
    }
    if (lowStock === true) {
      conditions.push('inventory_balances.quantity_on_hand <= m.minimum_stock');
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortBy = allowedBalanceSortFields.has(sortBy) ? `inventory_balances.${sortBy}` : 'inventory_balances.updated_at';
    const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT 
          inventory_balances.*,
          w.warehouse_code,
          w.warehouse_name,
          m.material_code,
          m.material_name,
          m.category,
          m.unit,
          m.minimum_stock
        FROM inventory_balances
        INNER JOIN warehouses w ON w.id = inventory_balances.warehouse_id
        INNER JOIN materials m ON m.id = inventory_balances.material_id
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM inventory_balances
        INNER JOIN warehouses w ON w.id = inventory_balances.warehouse_id
        INNER JOIN materials m ON m.id = inventory_balances.material_id
        ${whereSql}
      `,
      params,
    );

    return {
      items: rows.map(mapBalance),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findTransactions(filters) {
    const {
      page,
      limit,
      skip,
      transactionType,
      warehouseId,
      supplierId,
      orderId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    const conditions = [];
    const params = [];

    if (transactionType) {
      conditions.push('inventory_transactions.transaction_type = ?');
      params.push(transactionType);
    }
    if (warehouseId !== undefined) {
      conditions.push('inventory_transactions.warehouse_id = ?');
      params.push(warehouseId);
    }
    if (supplierId !== undefined) {
      conditions.push('inventory_transactions.supplier_id = ?');
      params.push(supplierId);
    }
    if (orderId !== undefined) {
      conditions.push('inventory_transactions.order_id = ?');
      params.push(orderId);
    }
    if (dateFrom) {
      conditions.push('inventory_transactions.transaction_date >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('inventory_transactions.transaction_date <= ?');
      params.push(dateTo);
    }
    if (search) {
      conditions.push(
        '(inventory_transactions.transaction_code LIKE ? OR inventory_transactions.reference_number LIKE ? OR inventory_transactions.notes LIKE ?)',
      );
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeSortBy = allowedTxSortFields.has(sortBy) ? `inventory_transactions.${sortBy}` : 'inventory_transactions.created_at';
    const safeSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const safeLimit = Number(limit);
    const safeSkip = Number(skip);

    const rows = await query(
      `
        SELECT 
          inventory_transactions.*,
          w.warehouse_code,
          w.warehouse_name,
          s.supplier_code,
          s.supplier_name,
          o.order_code,
          u1.username AS created_username,
          u1.full_name AS created_fullname,
          u2.username AS posted_username,
          u2.full_name AS posted_fullname
        FROM inventory_transactions
        INNER JOIN warehouses w ON w.id = inventory_transactions.warehouse_id
        LEFT JOIN suppliers s ON s.id = inventory_transactions.supplier_id
        LEFT JOIN orders o ON o.id = inventory_transactions.order_id
        LEFT JOIN users u1 ON u1.id = inventory_transactions.created_by
        LEFT JOIN users u2 ON u2.id = inventory_transactions.posted_by
        ${whereSql}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ${safeLimit} OFFSET ${safeSkip}
      `,
      params,
    );

    const countRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM inventory_transactions
        ${whereSql}
      `,
      params,
    );

    return {
      items: rows.map(mapTxRow),
      total: countRows[0].total,
      page,
      limit,
    };
  },

  async findTransactionById(id) {
    const rows = await query(
      `
        SELECT 
          inventory_transactions.*,
          w.warehouse_code,
          w.warehouse_name,
          s.supplier_code,
          s.supplier_name,
          o.order_code,
          u1.username AS created_username,
          u1.full_name AS created_fullname,
          u2.username AS posted_username,
          u2.full_name AS posted_fullname
        FROM inventory_transactions
        INNER JOIN warehouses w ON w.id = inventory_transactions.warehouse_id
        LEFT JOIN suppliers s ON s.id = inventory_transactions.supplier_id
        LEFT JOIN orders o ON o.id = inventory_transactions.order_id
        LEFT JOIN users u1 ON u1.id = inventory_transactions.created_by
        LEFT JOIN users u2 ON u2.id = inventory_transactions.posted_by
        WHERE inventory_transactions.id = ?
        LIMIT 1
      `,
      [id],
    );

    const tx = mapTxRow(rows[0]);
    if (!tx) {
      return null;
    }

    const itemRows = await query(
      `
        SELECT 
          iti.*,
          m.material_code,
          m.material_name,
          m.unit,
          m.category
        FROM inventory_transaction_items iti
        INNER JOIN materials m ON m.id = iti.material_id
        WHERE iti.inventory_transaction_id = ?
        ORDER BY iti.id ASC
      `,
      [id],
    );

    tx.items = itemRows.map((row) => ({
      id: row.id,
      materialId: row.material_id,
      materialCode: row.material_code,
      materialName: row.material_name,
      unit: row.unit,
      category: row.category,
      quantity: Number(row.quantity),
      unitCost: Number(row.unit_cost ?? 0),
      notes: row.notes,
    }));

    return tx;
  },

  async findByTransactionCode(code) {
    const rows = await query('SELECT id FROM inventory_transactions WHERE transaction_code = ? LIMIT 1', [code]);
    return rows[0] ?? null;
  },

  async findBalanceForUpdate(connection, warehouseId, materialId) {
    const [rows] = await connection.execute(
      `
        SELECT quantity_on_hand
        FROM inventory_balances
        WHERE warehouse_id = ? AND material_id = ?
        FOR UPDATE
      `,
      [warehouseId, materialId],
    );
    return rows[0] ? { quantityOnHand: Number(rows[0].quantity_on_hand ?? 0) } : null;
  },

  async updateBalance(connection, warehouseId, materialId, delta) {
    const [rows] = await connection.execute(
      'SELECT id, quantity_on_hand FROM inventory_balances WHERE warehouse_id = ? AND material_id = ? FOR UPDATE',
      [warehouseId, materialId],
    );

    if (rows.length > 0) {
      await connection.execute(
        'UPDATE inventory_balances SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?',
        [delta, rows[0].id],
      );
    } else {
      await connection.execute(
        'INSERT INTO inventory_balances (warehouse_id, material_id, quantity_on_hand) VALUES (?, ?, ?)',
        [warehouseId, materialId, delta],
      );
    }
  },

  async createTransaction({ transactionHeader, items, userId }) {
    return transaction(async (connection) => {
      // Create header
      const [result] = await connection.execute(
        `
          INSERT INTO inventory_transactions
            (transaction_code, transaction_type, warehouse_id, supplier_id, order_id, transaction_date, reference_number, notes, status, created_by, posted_by, posted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          transactionHeader.transactionCode,
          transactionHeader.transactionType,
          transactionHeader.warehouseId,
          transactionHeader.supplierId ?? null,
          transactionHeader.orderId ?? null,
          toDateString(transactionHeader.transactionDate),
          transactionHeader.referenceNumber ?? null,
          transactionHeader.notes ?? null,
          transactionHeader.status, // e.g. 'POSTED' or 'DRAFT'
          userId,
          transactionHeader.status === 'POSTED' ? userId : null,
          transactionHeader.status === 'POSTED' ? new Date() : null,
        ],
      );
      const txId = result.insertId;

      // Add items and update balances
      for (const item of items) {
        await connection.execute(
          `
            INSERT INTO inventory_transaction_items 
              (inventory_transaction_id, material_id, quantity, unit_cost, notes)
            VALUES (?, ?, ?, ?, ?)
          `,
          [
            txId,
            item.materialId,
            item.quantity,
            item.unitCost ?? 0,
            item.notes ?? null,
          ],
        );

        if (transactionHeader.status === 'POSTED') {
          let delta = Number(item.quantity);
          if (['ISSUE', 'ADJUSTMENT_OUT'].includes(transactionHeader.transactionType)) {
            delta = -delta;
          }

          // If subtract stock, lock balance and verify availability
          if (delta < 0) {
            const balance = await this.findBalanceForUpdate(connection, transactionHeader.warehouseId, item.materialId);
            const available = balance ? balance.quantityOnHand : 0;
            if (available < Math.abs(delta)) {
              // Fetch material code for message
              const [mRows] = await connection.execute('SELECT material_code FROM materials WHERE id = ?', [item.materialId]);
              const materialCode = mRows[0] ? mRows[0].material_code : item.materialId;
              throw new Error(`INSUFFICIENT_STOCK_FOR:${materialCode}`);
            }
          }

          await this.updateBalance(connection, transactionHeader.warehouseId, item.materialId, delta);
        }
      }

      return txId;
    });
  },

  async getDashboardSummary() {
    const materials = await query('SELECT COUNT(*) AS total FROM materials');
    
    // total low stock materials (where sum of balances <= minimum stock)
    const lowStock = await query(`
      SELECT COUNT(*) AS total FROM (
        SELECT m.id
        FROM materials m
        LEFT JOIN (
          SELECT material_id, SUM(quantity_on_hand) AS total_stock
          FROM inventory_balances
          GROUP BY material_id
        ) AS ib ON ib.material_id = m.id
        WHERE COALESCE(ib.total_stock, 0) <= m.minimum_stock AND m.is_active = TRUE
      ) AS low_materials
    `);

    const warehouses = await query('SELECT COUNT(*) AS total FROM warehouses');
    
    const receiptsMonth = await query(`
      SELECT COUNT(*) AS total 
      FROM inventory_transactions 
      WHERE transaction_type = 'RECEIPT' 
        AND status = 'POSTED'
        AND MONTH(transaction_date) = MONTH(CURDATE()) 
        AND YEAR(transaction_date) = YEAR(CURDATE())
    `);

    const issuesMonth = await query(`
      SELECT COUNT(*) AS total 
      FROM inventory_transactions 
      WHERE transaction_type = 'ISSUE' 
        AND status = 'POSTED'
        AND MONTH(transaction_date) = MONTH(CURDATE()) 
        AND YEAR(transaction_date) = YEAR(CURDATE())
    `);

    // Fetch transactions by type for chart
    const txByType = await query(`
      SELECT transaction_type AS name, COUNT(*) AS value
      FROM inventory_transactions
      WHERE status = 'POSTED'
      GROUP BY transaction_type
    `);

    return {
      totalMaterials: Number(materials[0].total ?? 0),
      lowStockMaterials: Number(lowStock[0].total ?? 0),
      totalWarehouses: Number(warehouses[0].total ?? 0),
      receiptsThisMonth: Number(receiptsMonth[0].total ?? 0),
      issuesThisMonth: Number(issuesMonth[0].total ?? 0),
      txByType: txByType.map((row) => ({ name: row.name, value: Number(row.value) })),
    };
  },
};
