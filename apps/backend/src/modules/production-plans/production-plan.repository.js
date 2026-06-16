import { query } from '../../config/database.js';

const toDateString = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  const d = new Date(val);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const mapAllocation = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    productionOrderId: row.production_order_id,
    productionOrderCode: row.production_order_code,
    productId: row.product_id,
    productName: row.product_name,
    productionLineId: row.production_line_id,
    lineCode: row.line_code,
    lineName: row.line_name,
    allocatedQuantity: Number(row.allocated_quantity ?? 0),
    plannedStartDate: toDateString(row.planned_start_date),
    plannedEndDate: toDateString(row.planned_end_date),
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapSchedule = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    productionAllocationId: row.id,
    productionOrderId: row.production_order_id,
    productionOrderCode: row.production_order_code,
    productId: row.product_id,
    productName: row.product_name,
    productionLineId: row.production_line_id,
    lineCode: row.line_code,
    lineName: row.line_name,
    shiftId: row.shift_id,
    shiftCode: row.shift_code,
    shiftName: row.shift_name,
    startTime: row.start_time,
    endTime: row.end_time,
    scheduleDate: toDateString(row.schedule_date),
    allocatedQuantity: Number(row.allocated_quantity ?? 0),
    targetQuantity: Number(row.target_quantity ?? 0),
    plannedWorkers: Number(row.planned_workers ?? 0),
    plannedStartDate: toDateString(row.planned_start_date),
    plannedEndDate: toDateString(row.planned_end_date),
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const productionPlanRepository = {
  async findAllocations(filters = {}) {
    const { productionOrderId, productionLineId, status } = filters;
    const conditions = [];
    const params = [];

    if (productionOrderId !== undefined) {
      conditions.push('ps.production_order_id = ?');
      params.push(productionOrderId);
    }
    if (productionLineId !== undefined) {
      conditions.push('ps.production_line_id = ?');
      params.push(productionLineId);
    }
    if (status) {
      conditions.push('ps.status = ?');
      params.push(status);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT ps.*, po.production_order_code, po.product_id, p.product_name, pl.line_code, pl.line_name
        FROM production_schedules ps
        INNER JOIN production_orders po ON po.id = ps.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN production_lines pl ON pl.id = ps.production_line_id
        ${whereSql}
        ORDER BY ps.id DESC
      `,
      params
    );
    return rows.map(mapAllocation);
  },

  async findAllocationById(id) {
    const rows = await query(
      `
        SELECT ps.*, po.production_order_code, po.product_id, p.product_name, pl.line_code, pl.line_name
        FROM production_schedules ps
        INNER JOIN production_orders po ON po.id = ps.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN production_lines pl ON pl.id = ps.production_line_id
        WHERE ps.id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapAllocation(rows[0]);
  },

  async getSumOfOtherAllocations(productionOrderId, excludeScheduleId = 0) {
    const rows = await query(
      `
        SELECT SUM(allocated_quantity) AS total_allocated
        FROM production_schedules
        WHERE production_order_id = ? AND status != 'CANCELLED' AND id != ?
      `,
      [productionOrderId, excludeScheduleId]
    );
    return Number(rows[0]?.total_allocated ?? 0);
  },

  async createAllocation(data, userId) {
    const result = await query(
      `
        INSERT INTO production_schedules (
          production_order_id, production_line_id, shift_id, schedule_date, allocated_quantity, target_quantity,
          planned_workers, planned_start_date, planned_end_date, status, notes, created_by, updated_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.productionOrderId,
        data.productionLineId,
        data.shiftId ?? 1,
        toDateString(data.scheduleDate ?? data.plannedStartDate),
        data.allocatedQuantity,
        data.targetQuantity ?? data.allocatedQuantity,
        data.plannedWorkers ?? 1,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.status ?? 'DRAFT',
        data.notes ?? null,
        userId,
        userId,
      ]
    );
    return result.insertId;
  },

  async updateAllocation(id, data) {
    await query(
      `
        UPDATE production_schedules
        SET production_line_id = ?, allocated_quantity = ?, target_quantity = ?, planned_start_date = ?, planned_end_date = ?, status = ?, notes = ?
        WHERE id = ?
      `,
      [
        data.productionLineId,
        data.allocatedQuantity,
        data.targetQuantity ?? data.allocatedQuantity,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.status,
        data.notes ?? null,
        id,
      ]
    );
    return this.findAllocationById(id);
  },

  async findSchedules(filters = {}) {
    const { productionLineId, shiftId, dateFrom, dateTo, scheduleDate } = filters;
    const conditions = [];
    const params = [];

    if (productionLineId !== undefined) {
      conditions.push('ps.production_line_id = ?');
      params.push(productionLineId);
    }
    if (shiftId !== undefined) {
      conditions.push('ps.shift_id = ?');
      params.push(shiftId);
    }
    if (scheduleDate) {
      conditions.push('ps.schedule_date = ?');
      params.push(scheduleDate);
    }
    if (dateFrom) {
      conditions.push('ps.schedule_date >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('ps.schedule_date <= ?');
      params.push(dateTo);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT ps.*, po.production_order_code, po.product_id, p.product_name,
               pl.line_code, pl.line_name,
               s.shift_code, s.shift_name, s.start_time, s.end_time
        FROM production_schedules ps
        INNER JOIN production_orders po ON po.id = ps.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN production_lines pl ON pl.id = ps.production_line_id
        INNER JOIN shifts s ON s.id = ps.shift_id
        ${whereSql}
        ORDER BY ps.schedule_date DESC, ps.id DESC
      `,
      params
    );
    return rows.map(mapSchedule);
  },

  async findScheduleById(id) {
    const rows = await query(
      `
        SELECT ps.*, po.production_order_code, po.product_id, p.product_name,
               pl.line_code, pl.line_name,
               s.shift_code, s.shift_name, s.start_time, s.end_time
        FROM production_schedules ps
        INNER JOIN production_orders po ON po.id = ps.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN production_lines pl ON pl.id = ps.production_line_id
        INNER JOIN shifts s ON s.id = ps.shift_id
        WHERE ps.id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapSchedule(rows[0]);
  },

  async checkScheduleExistsForLineShiftDate(lineId, shiftId, date, excludeSchedId = 0) {
    const rows = await query(
      `
        SELECT id FROM production_schedules
        WHERE production_line_id = ? AND shift_id = ? AND schedule_date = ? AND id != ? AND status != 'CANCELLED'
        LIMIT 1
      `,
      [lineId, shiftId, toDateString(date), excludeSchedId]
    );
    return rows[0] ?? null;
  },

  async createSchedule(data, userId) {
    const result = await query(
      `
        INSERT INTO production_schedules (
          production_order_id, production_line_id, shift_id, schedule_date, allocated_quantity, target_quantity,
          planned_workers, planned_start_date, planned_end_date, status, notes, created_by, updated_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.productionOrderId,
        data.productionLineId,
        data.shiftId,
        toDateString(data.scheduleDate),
        data.allocatedQuantity,
        data.targetQuantity,
        data.plannedWorkers,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.status ?? 'DRAFT',
        data.notes ?? null,
        userId,
        userId,
      ]
    );
    return result.insertId;
  },

  async updateSchedule(id, data, userId) {
    await query(
      `
        UPDATE production_schedules
        SET production_order_id = ?, production_line_id = ?, shift_id = ?, schedule_date = ?, allocated_quantity = ?,
            target_quantity = ?, planned_workers = ?, planned_start_date = ?, planned_end_date = ?, status = ?, notes = ?, updated_by = ?
        WHERE id = ?
      `,
      [
        data.productionOrderId,
        data.productionLineId,
        data.shiftId,
        toDateString(data.scheduleDate),
        data.allocatedQuantity,
        data.targetQuantity,
        data.plannedWorkers,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.status,
        data.notes ?? null,
        userId,
        id,
      ]
    );
    return this.findScheduleById(id);
  },

  async findScheduleAssignments() {
    return [];
  },

  async getEmployeeShiftsOnDate() {
    return [];
  },

  async assignEmployeeToSchedule() {
    return 0;
  },

  async removeEmployeeFromSchedule() {},

  async removeAllEmployeesFromSchedule() {},
};
