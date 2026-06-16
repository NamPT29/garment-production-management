import { AppError } from '../../utils/app-error.js';
import { productionPlanRepository } from './production-plan.repository.js';
import { productionOrderRepository } from '../production-orders/production-order.repository.js';
import { productionLineRepository } from '../production-lines/production-line.repository.js';
import { shiftRepository } from '../shifts/shift.repository.js';
import { employeeRepository } from '../employees/employee.repository.js';
import { operationRepository } from '../operations/operation.repository.js';

const parseTimeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getShiftInterval = (startStr, endStr) => {
  const start = parseTimeToMinutes(startStr);
  let end = parseTimeToMinutes(endStr);
  if (end <= start) {
    end += 1440; // overnight shift
  }
  return { start, end };
};

const checkShiftOverlap = (s1Start, s1End, s2Start, s2End) => {
  const i1 = getShiftInterval(s1Start, s1End);
  const i2 = getShiftInterval(s2Start, s2End);
  return i1.start < i2.end && i2.start < i1.end;
};

export const productionPlanService = {
  // === Allocations ===
  async listAllocations(filters) {
    return productionPlanRepository.findAllocations(filters);
  },

  async getAllocationDetail(id) {
    const alloc = await productionPlanRepository.findAllocationById(id);
    if (!alloc) {
      throw new AppError('Phân bổ sản xuất không tồn tại', 404, 'ALLOCATION_NOT_FOUND');
    }
    return alloc;
  },

  async createAllocation(payload, userId) {
    const po = await productionOrderRepository.findById(payload.productionOrderId);
    if (!po) {
      throw new AppError('Lệnh sản xuất không tồn tại', 400, 'PRODUCTION_ORDER_NOT_FOUND');
    }

    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    // Guard allocation cap
    const sumAllocated = await productionPlanRepository.getSumOfOtherAllocations(payload.productionOrderId);
    if (sumAllocated + payload.allocatedQuantity > po.plannedQuantity) {
      const remaining = po.plannedQuantity - sumAllocated;
      throw new AppError(
        `Tổng số lượng phân bổ vượt quá số lượng kế hoạch của lệnh sản xuất (Còn lại có thể phân bổ: ${remaining})`,
        400,
        'ALLOCATION_QUANTITY_EXCEEDED'
      );
    }

    const id = await productionPlanRepository.createAllocation(payload, userId);
    return this.getAllocationDetail(id);
  },

  async updateAllocation(id, payload) {
    const existing = await this.getAllocationDetail(id);
    const po = await productionOrderRepository.findById(existing.productionOrderId);
    
    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    // Guard allocation cap
    const sumAllocated = await productionPlanRepository.getSumOfOtherAllocations(existing.productionOrderId, id);
    if (sumAllocated + payload.allocatedQuantity > po.plannedQuantity) {
      const remaining = po.plannedQuantity - sumAllocated;
      throw new AppError(
        `Tổng số lượng phân bổ vượt quá số lượng kế hoạch của lệnh sản xuất (Còn lại có thể phân bổ: ${remaining})`,
        400,
        'ALLOCATION_QUANTITY_EXCEEDED'
      );
    }

    return productionPlanRepository.updateAllocation(id, payload);
  },

  // === Schedules ===
  async listSchedules(filters) {
    return productionPlanRepository.findSchedules(filters);
  },

  async getScheduleDetail(id) {
    const sched = await productionPlanRepository.findScheduleById(id);
    if (!sched) {
      throw new AppError('Kế hoạch sản xuất không tồn tại', 404, 'SCHEDULE_NOT_FOUND');
    }
    return sched;
  },

  async createSchedule(payload, userId) {
    await this.getAllocationDetail(payload.productionAllocationId);
    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    const shift = await shiftRepository.findById(payload.shiftId);
    if (!shift) {
      throw new AppError('Ca làm việc không tồn tại', 400, 'SHIFT_NOT_FOUND');
    }

    // Check line shift date conflict
    const conflict = await productionPlanRepository.checkScheduleExistsForLineShiftDate(
      payload.productionLineId,
      payload.shiftId,
      payload.scheduleDate
    );
    if (conflict) {
      throw new AppError(
        'Chuyền may đã có kế hoạch sản xuất cho ca làm việc và ngày này',
        400,
        'LINE_SHIFT_DATE_SCHEDULE_CONFLICT'
      );
    }

    const id = await productionPlanRepository.createSchedule(payload, userId);
    return this.getScheduleDetail(id);
  },

  async updateSchedule(id, payload, userId) {
    await this.getScheduleDetail(id);
    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    const shift = await shiftRepository.findById(payload.shiftId);
    if (!shift) {
      throw new AppError('Ca làm việc không tồn tại', 400, 'SHIFT_NOT_FOUND');
    }

    // Check conflict
    const conflict = await productionPlanRepository.checkScheduleExistsForLineShiftDate(
      payload.productionLineId,
      payload.shiftId,
      payload.scheduleDate,
      id
    );
    if (conflict) {
      throw new AppError(
        'Chuyền may đã có kế hoạch sản xuất cho ca làm việc và ngày này',
        400,
        'LINE_SHIFT_DATE_SCHEDULE_CONFLICT'
      );
    }

    return productionPlanRepository.updateSchedule(id, payload, userId);
  },

  // === Worker Assignments ===
  async getScheduleAssignments(scheduleId) {
    await this.getScheduleDetail(scheduleId);
    return productionPlanRepository.findScheduleAssignments(scheduleId);
  },

  async assignEmployeeToSchedule(scheduleId, payload, userId) {
    const schedule = await this.getScheduleDetail(scheduleId);
    
    const employee = await employeeRepository.findById(payload.employeeId);
    if (!employee) {
      throw new AppError('Nhân viên không tồn tại', 400, 'EMPLOYEE_NOT_FOUND');
    }
    if (employee.status !== 'ACTIVE') {
      throw new AppError('Nhân viên không hoạt động', 400, 'EMPLOYEE_NOT_ACTIVE');
    }

    const operation = await operationRepository.findById(payload.operationId);
    if (!operation) {
      throw new AppError('Công đoạn không tồn tại', 400, 'OPERATION_NOT_FOUND');
    }

    // Guard worker overlapping schedules
    const existingShifts = await productionPlanRepository.getEmployeeShiftsOnDate(payload.employeeId, schedule.scheduleDate);
    for (const s of existingShifts) {
      const overlap = checkShiftOverlap(schedule.startTime, schedule.endTime, s.startTime, s.endTime);
      if (overlap) {
        throw new AppError(
          `Nhân viên đã được phân công vào ca làm việc khác trùng thời gian trên ngày ${schedule.scheduleDate} (Ca: ${s.shiftName})`,
          400,
          'EMPLOYEE_SCHEDULE_OVERLAP'
        );
      }
    }

    const id = await productionPlanRepository.assignEmployeeToSchedule(
      {
        ...payload,
        productionScheduleId: scheduleId,
      },
      userId
    );
    return { assignmentId: id };
  },

  async removeEmployeeFromSchedule(scheduleId, assignmentId) {
    await this.getScheduleDetail(scheduleId);
    await productionPlanRepository.removeEmployeeFromSchedule(scheduleId, assignmentId);
    return { success: true };
  },
};
