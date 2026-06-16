import { query, transaction } from '../../config/database.js';

const toDateString = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  const d = new Date(val);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const mapOutput = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    productionScheduleId: row.production_schedule_id,
    productionOrderId: row.production_order_id,
    productionOrderCode: row.production_order_code, // Joined field
    productId: row.product_id, // Joined field
    productName: row.product_name, // Joined field
    productionLineId: row.production_line_id,
    lineCode: row.line_code, // Joined field
    lineName: row.line_name, // Joined field
    shiftId: row.shift_id,
    shiftCode: row.shift_code, // Joined field
    shiftName: row.shift_name, // Joined field
    outputDate: toDateString(row.output_date),
    goodQuantity: Number(row.good_quantity ?? 0),
    defectQuantity: Number(row.defect_quantity ?? 0),
    rework_quantity: Number(row.rework_quantity ?? 0),
    workingMinutes: Number(row.working_minutes ?? 0),
    downtimeMinutes: Number(row.downtime_minutes ?? 0),
    notes: row.notes,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
};

export const productionOutputRepository = {
  async findMany(filters = {}) {
    const { productionLineId, productionOrderId, dateFrom, dateTo } = filters;
    const conditions = [];
    const params = [];

    if (productionLineId !== undefined) {
      conditions.push('po.production_line_id = ?');
      params.push(productionLineId);
    }
    if (productionOrderId !== undefined) {
      conditions.push('po.production_order_id = ?');
      params.push(productionOrderId);
    }
    if (dateFrom) {
      conditions.push('po.output_date >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('po.output_date <= ?');
      params.push(dateTo);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT po.*, 
               pord.production_order_code, pord.product_id, p.product_name,
               pl.line_code, pl.line_name,
               s.shift_code, s.shift_name
        FROM production_outputs po
        INNER JOIN production_orders pord ON pord.id = po.production_order_id
        INNER JOIN products p ON p.id = pord.product_id
        INNER JOIN production_lines pl ON pl.id = po.production_line_id
        INNER JOIN shifts s ON s.id = po.shift_id
        ${whereSql}
        ORDER BY po.output_date DESC, po.id DESC
      `,
      params
    );
    return rows.map(mapOutput);
  },

  async findById(id) {
    const rows = await query(
      `
        SELECT po.*, 
               pord.production_order_code, pord.product_id, p.product_name,
               pl.line_code, pl.line_name,
               s.shift_code, s.shift_name
        FROM production_outputs po
        INNER JOIN production_orders pord ON pord.id = po.production_order_id
        INNER JOIN products p ON p.id = pord.product_id
        INNER JOIN production_lines pl ON pl.id = po.production_line_id
        INNER JOIN shifts s ON s.id = po.shift_id
        WHERE po.id = ?
        LIMIT 1
      `,
      [id]
    );
    const output = mapOutput(rows[0]);
    if (!output) return null;

    // Fetch employee outputs
    const empRows = await query(
      `
        SELECT eo.*, e.employee_code, e.full_name, o.operation_code, o.operation_name
        FROM employee_outputs eo
        INNER JOIN employees e ON e.id = eo.employee_id
        INNER JOIN operations o ON o.id = eo.operation_id
        WHERE eo.production_output_id = ?
      `,
      [id]
    );

    output.employeeOutputs = empRows.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeCode: row.employee_code,
      fullName: row.full_name,
      operationId: row.operation_id,
      operationCode: row.operation_code,
      operationName: row.operation_name,
      goodQuantity: Number(row.good_quantity ?? 0),
      defectQuantity: Number(row.defect_quantity ?? 0),
      workingMinutes: Number(row.working_minutes ?? 0),
      notes: row.notes,
    }));

    return output;
  },

  async createOutputInTransaction({ outputData, employeeOutputs, poUpdate, snapshotData, userId }) {
    return transaction(async (connection) => {
      // 1. Lock Production Order for update
      const [poRows] = await connection.execute(
        `SELECT completed_quantity, planned_quantity FROM production_orders WHERE id = ? FOR UPDATE`,
        [outputData.productionOrderId]
      );
      if (poRows.length === 0) {
        throw new Error('PRODUCTION_ORDER_NOT_FOUND');
      }

      const currentCompleted = Number(poRows[0].completed_quantity ?? 0);
      const plannedQty = Number(poRows[0].planned_quantity ?? 0);
      const newCompleted = currentCompleted + outputData.goodQuantity;

      if (newCompleted > plannedQty) {
        throw new Error('GOOD_QUANTITY_EXCEEDS_PLAN');
      }

      // 2. Lock Schedule for update
      const [schedRows] = await connection.execute(
        `SELECT status FROM production_schedules WHERE id = ? FOR UPDATE`,
        [outputData.productionScheduleId]
      );
      if (schedRows.length === 0) {
        throw new Error('SCHEDULE_NOT_FOUND');
      }

      // 3. Insert Production Output header
      const [outResult] = await connection.execute(
        `
          INSERT INTO production_outputs (
            production_schedule_id, production_order_id, production_line_id, shift_id, output_date, 
            good_quantity, defect_quantity, rework_quantity, working_minutes, downtime_minutes, notes, recorded_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          outputData.productionScheduleId,
          outputData.productionOrderId,
          outputData.productionLineId,
          outputData.shiftId,
          toDateString(outputData.outputDate),
          outputData.goodQuantity,
          outputData.defectQuantity,
          outputData.reworkQuantity ?? 0,
          outputData.workingMinutes ?? 0,
          outputData.downtimeMinutes ?? 0,
          outputData.notes ?? null,
          userId,
        ]
      );
      const outputId = outResult.insertId;

      // 4. Insert Employee Outputs
      for (const item of employeeOutputs) {
        await connection.execute(
          `
            INSERT INTO employee_outputs (
              production_output_id, employee_id, operation_id, good_quantity, defect_quantity, working_minutes, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            outputId,
            item.employeeId,
            item.operationId,
            item.goodQuantity,
            item.defectQuantity,
            item.workingMinutes ?? 0,
            item.notes ?? null,
          ]
        );
      }

      // 5. Update Production Order quantities and status
      await connection.execute(
        `
          UPDATE production_orders
          SET completed_quantity = completed_quantity + ?,
              rejected_quantity = rejected_quantity + ?,
              status = ?,
              actual_start_date = COALESCE(actual_start_date, ?),
              actual_end_date = ?
          WHERE id = ?
        `,
        [
          outputData.goodQuantity,
          outputData.defectQuantity,
          poUpdate.status,
          toDateString(poUpdate.actualStartDate),
          toDateString(poUpdate.actualEndDate),
          outputData.productionOrderId,
        ]
      );

      // 6. Update Schedule status to CONFIRMED or COMPLETED/IN_PROGRESS if necessary
      await connection.execute(
        `
          UPDATE production_schedules
          SET status = 'IN_PROGRESS'
          WHERE id = ? AND status = 'CONFIRMED'
        `,
        [outputData.productionScheduleId]
      );

      // 7. Insert Production Progress Snapshot
      await connection.execute(
        `
          INSERT INTO production_progress_snapshots (
            production_order_id, snapshot_date, planned_quantity, completed_quantity, remaining_quantity, 
            progress_percent, expected_progress_percent, delay_quantity, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          outputData.productionOrderId,
          toDateString(snapshotData.snapshotDate),
          snapshotData.plannedQuantity,
          newCompleted, // completed_quantity
          snapshotData.plannedQuantity - newCompleted, // remaining_quantity
          snapshotData.progressPercent,
          snapshotData.expectedProgressPercent,
          snapshotData.delayQuantity,
          snapshotData.status,
        ]
      );

      return outputId;
    });
  },
};
