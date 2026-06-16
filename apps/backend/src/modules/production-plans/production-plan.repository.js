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
    productionOrderCode: row.production_order_code, // Joined field
    productId: row.product_id, // Joined field
    productName: row.product_name, // Joined field
    productionLineId: row.production_line_id,
    lineCode: row.line_code, // Joined field
    lineName: row.line_name, // Joined field
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
    productionAllocationId: row.production_allocation_id,
    productionOrderId: row.production_order_id, // Joined field
    productionOrderCode: row.production_order_code, // Joined field
    productId: row.product_id, // Joined field
    productName: row.product_name, // Joined field
    productionLineId: row.production_line_id,
    lineCode: row.line_code, // Joined field
    lineName: row.line_name, // Joined field
    shiftId: row.shift_id,
    shiftCode: row.shift_code, // Joined field
    shiftName: row.shift_name, // Joined field
    startTime: row.start_time, // Joined field
    endTime: row.end_time, // Joined field
    scheduleDate: toDateString(row.schedule_date),
    targetQuantity: Number(row.target_quantity ?? 0),
    plannedWorkers: Number(row.planned_workers ?? 0),
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapAssignment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    productionScheduleId: row.production_schedule_id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code, // Joined field
    fullName: row.full_name, // Joined field
    operationId: row.operation_id,
    operationCode: row.operation_code, // Joined field
    operationName: row.operation_name, // Joined field
    assignedQuantity: row.assigned_quantity ? Number(row.assigned_quantity) : null,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
};

export const productionPlanRepository = {
  // === Allocations ===
  async findAllocations(filters = {}) {
    const { productionOrderId, productionLineId, status } = filters;
    const conditions = [];
    const params = [];

    if (productionOrderId !== undefined) {
      conditions.push('pa.production_order_id = ?');
      params.push(productionOrderId);
    }
    if (productionLineId !== undefined) {
      conditions.push('pa.production_line_id = ?');
      params.push(productionLineId);
    }
    if (status) {
      conditions.push('pa.status = ?');
      params.push(status);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT pa.*, po.production_order_code, po.product_id, p.product_name, pl.line_code, pl.line_name
        FROM production_allocations pa
        INNER JOIN production_orders po ON po.id = pa.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN production_lines pl ON pl.id = pa.production_line_id
        ${whereSql}
        ORDER BY pa.id DESC
      `,
      params
    );
    return rows.map(mapAllocation);
  },

  async findAllocationById(id) {
    const rows = await query(
      `
        SELECT pa.*, po.production_order_code, po.product_id, p.product_name, pl.line_code, pl.line_name
        FROM production_allocations pa
        INNER JOIN production_orders po ON po.id = pa.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN production_lines pl ON pl.id = pa.production_line_id
        WHERE pa.id = ?
        LIMIT 1
      `,
      [id]
    );
    return mapAllocation(rows[0]);
  },

  async getSumOfOtherAllocations(productionOrderId, excludeAllocId = 0) {
    const rows = await query(
      `
        SELECT SUM(allocated_quantity) AS total_allocated
        FROM production_allocations
        WHERE production_order_id = ? AND status != 'CANCELLED' AND id != ?
      `,
      [productionOrderId, excludeAllocId]
    );
    return Number(rows[0]?.total_allocated ?? 0);
  },

  async createAllocation(data, userId) {
    const result = await query(
      `
        INSERT INTO production_allocations (
          production_order_id, production_line_id, allocated_quantity, planned_start_date, planned_end_date, status, notes, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.productionOrderId,
        data.productionLineId,
        data.allocatedQuantity,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.status ?? 'PLANNED',
        data.notes ?? null,
        userId,
      ]
    );
    return result.insertId;
  },

  async updateAllocation(id, data) {
    await query(
      `
        UPDATE production_allocations
        SET production_line_id = ?, allocated_quantity = ?, planned_start_date = ?, planned_end_date = ?, status = ?, notes = ?
        WHERE id = ?
      `,
      [
        data.productionLineId,
        data.allocatedQuantity,
        toDateString(data.plannedStartDate),
        toDateString(data.plannedEndDate),
        data.status,
        data.notes ?? null,
        id,
      ]
    );
    return this.findAllocationById(id);
  },

  // === Schedules ===
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
        SELECT ps.*, 
               pa.production_order_id, po.production_order_code, po.product_id, p.product_name,
               pl.line_code, pl.line_name,
               s.shift_code, s.shift_name, s.start_time, s.end_time
        FROM production_schedules ps
        INNER JOIN production_allocations pa ON pa.id = ps.production_allocation_id
        INNER JOIN production_orders po ON po.id = pa.production_order_id
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
        SELECT ps.*, 
               pa.production_order_id, po.production_order_code, po.product_id, p.product_name,
               pl.line_code, pl.line_name,
               s.shift_code, s.shift_name, s.start_time, s.end_time
        FROM production_schedules ps
        INNER JOIN production_allocations pa ON pa.id = ps.production_allocation_id
        INNER JOIN production_orders po ON po.id = pa.production_order_id
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
          production_allocation_id, production_line_id, shift_id, schedule_date, target_quantity, planned_workers, status, notes, created_by, updated_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.productionAllocationId,
        data.productionLineId,
        data.shiftId,
        toDateString(data.scheduleDate),
        data.targetQuantity,
        data.plannedWorkers,
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
        SET production_allocation_id = ?, production_line_id = ?, shift_id = ?, schedule_date = ?, target_quantity = ?, planned_workers = ?, status = ?, notes = ?, updated_by = ?
        WHERE id = ?
      `,
      [
        data.productionAllocationId,
        data.productionLineId,
        data.shiftId,
        toDateString(data.scheduleDate),
        data.targetQuantity,
        data.plannedWorkers,
        data.status,
        data.notes ?? null,
        userId,
        id,
      ]
    );
    return this.findScheduleById(id);
  },

  // === Employee Shift Assignments ===
  async findScheduleAssignments(scheduleId) {
    const rows = await query(
      `
        SELECT sa.*, e.employee_code, e.full_name, o.operation_code, o.operation_name
        FROM schedule_employee_assignments sa
        INNER JOIN employees e ON e.id = sa.employee_id
        INNER JOIN operations o ON o.id = sa.operation_id
        WHERE sa.production_schedule_id = ?
        ORDER BY sa.id ASC
      `,
      [scheduleId]
    );
    return rows.map(mapAssignment);
  },

  async getEmployeeShiftsOnDate(employeeId, scheduleDate) {
    const rows = await query(
      `
        SELECT sa.id AS assignment_id, ps.id AS schedule_id, ps.schedule_date, 
               s.shift_name, s.start_time, s.end_time
        FROM schedule_employee_assignments sa
        INNER JOIN production_schedules ps ON ps.id = sa.production_schedule_id
        INNER JOIN shifts s ON s.id = ps.shift_id
        WHERE sa.employee_id = ? AND ps.schedule_date = ? AND ps.status != 'CANCELLED'
      `,
      [employeeId, toDateString(scheduleDate)]
    );
    return rows.map((row) => ({
      assignmentId: row.assignment_id,
      scheduleId: row.schedule_id,
      scheduleDate: toDateString(row.schedule_date),
      shiftName: row.shift_name,
      startTime: row.start_time,
      endTime: row.end_time,
    }));
  },

  async assignEmployeeToSchedule(data, userId) {
    const result = await query(
      `
        INSERT INTO schedule_employee_assignments (production_schedule_id, employee_id, operation_id, assigned_quantity, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        data.productionScheduleId,
        data.employeeId,
        data.operationId,
        data.assignedQuantity ?? null,
        data.notes ?? null,
        userId,
      ]
    );
    return result.insertId;
  },

  async removeEmployeeFromSchedule(scheduleId, assignmentId) {
    await query(
      'DELETE FROM schedule_employee_assignments WHERE production_schedule_id = ? AND id = ?',
      [scheduleId, assignmentId]
    );
  },

  async removeAllEmployeesFromSchedule(scheduleId) {
    await query('DELETE FROM schedule_employee_assignments WHERE production_schedule_id = ?', [scheduleId]);
  },
};
