import { AppError } from '../../utils/app-error.js';
import { productionPlanRepository } from './production-plan.repository.js';
import { productionOrderRepository } from '../production-orders/production-order.repository.js';
import { productionLineRepository } from '../production-lines/production-line.repository.js';
import { shiftRepository } from '../shifts/shift.repository.js';

export const productionPlanService = {
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
    const po = await productionOrderRepository.findById(payload.productionOrderId);
    if (!po) {
      throw new AppError('Lệnh sản xuất không tồn tại', 400, 'PRODUCTION_ORDER_NOT_FOUND');
    }

    // Guard: tổng allocatedQuantity không vượt plannedQuantity
    const sumAllocated = await productionPlanRepository.getSumOfOtherAllocations(payload.productionOrderId);
    if (sumAllocated + payload.allocatedQuantity > po.plannedQuantity) {
      const remaining = po.plannedQuantity - sumAllocated;
      throw new AppError(
        `Tổng số lượng phân bổ vượt quá số lượng kế hoạch của lệnh sản xuất (Còn lại có thể phân bổ: ${remaining})`,
        400,
        'ALLOCATION_QUANTITY_EXCEEDED'
      );
    }

    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    const shift = await shiftRepository.findById(payload.shiftId);
    if (!shift) {
      throw new AppError('Ca làm việc không tồn tại', 400, 'SHIFT_NOT_FOUND');
    }

    // Guard: một chuyền + một ca + một ngày không bị trùng schedule active
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
    const existing = await this.getScheduleDetail(id);
    const po = await productionOrderRepository.findById(payload.productionOrderId);
    if (!po) {
      throw new AppError('Lệnh sản xuất không tồn tại', 400, 'PRODUCTION_ORDER_NOT_FOUND');
    }

    // Guard: tổng allocatedQuantity không vượt plannedQuantity (bỏ qua schedule hiện tại)
    const sumAllocated = await productionPlanRepository.getSumOfOtherAllocations(payload.productionOrderId, existing.id);
    if (sumAllocated + payload.allocatedQuantity > po.plannedQuantity) {
      const remaining = po.plannedQuantity - sumAllocated;
      throw new AppError(
        `Tổng số lượng phân bổ vượt quá số lượng kế hoạch của lệnh sản xuất (Còn lại có thể phân bổ: ${remaining})`,
        400,
        'ALLOCATION_QUANTITY_EXCEEDED'
      );
    }

    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    const shift = await shiftRepository.findById(payload.shiftId);
    if (!shift) {
      throw new AppError('Ca làm việc không tồn tại', 400, 'SHIFT_NOT_FOUND');
    }

    // Guard: conflict chuyền + ca + ngày (bỏ qua chính nó)
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
};
