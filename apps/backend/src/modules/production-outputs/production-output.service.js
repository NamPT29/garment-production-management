import { AppError } from '../../utils/app-error.js';
import { productionOutputRepository } from './production-output.repository.js';
import { productionOrderRepository } from '../production-orders/production-order.repository.js';
import { productionPlanRepository } from '../production-plans/production-plan.repository.js';

export const productionOutputService = {
  async list(filters) {
    return productionOutputRepository.findMany(filters);
  },

  async getDetail(id) {
    const output = await productionOutputRepository.findById(id);
    if (!output) {
      throw new AppError('Phiếu ghi nhận sản lượng không tồn tại', 404, 'PRODUCTION_OUTPUT_NOT_FOUND');
    }
    return output;
  },

  async create(payload, userId) {
    const po = await productionOrderRepository.findById(payload.productionOrderId);
    if (!po) {
      throw new AppError('Lệnh sản xuất không tồn tại', 400, 'PRODUCTION_ORDER_NOT_FOUND');
    }

    if (!['RELEASED', 'IN_PROGRESS', 'PAUSED'].includes(po.status)) {
      throw new AppError('Chỉ có thể ghi nhận sản lượng cho lệnh sản xuất đang hoạt động (RELEASED, IN_PROGRESS, PAUSED)', 400, 'PRODUCTION_ORDER_NOT_ACTIVE');
    }

    const sched = await productionPlanRepository.findScheduleById(payload.productionScheduleId);
    if (!sched) {
      throw new AppError('Kế hoạch sản xuất không tồn tại', 400, 'SCHEDULE_NOT_FOUND');
    }

    const newCompleted = po.completedQuantity + payload.goodQuantity;
    if (newCompleted > po.plannedQuantity) {
      throw new AppError(
        `Số lượng đạt (${payload.goodQuantity}) cộng với lũy kế đã hoàn thành (${po.completedQuantity}) vượt quá số lượng kế hoạch (${po.plannedQuantity})`,
        400,
        'GOOD_QUANTITY_EXCEEDS_PLAN'
      );
    }

    // Determine status transitions for PO
    let nextPoStatus = 'IN_PROGRESS';
    let actualEndDate = null;
    if (newCompleted >= po.plannedQuantity) {
      nextPoStatus = 'COMPLETED';
      actualEndDate = payload.outputDate;
    }

    const poUpdate = {
      status: nextPoStatus,
      actualStartDate: po.actualStartDate || payload.outputDate,
      actualEndDate: actualEndDate,
    };

    // Calculate Snapshot progress
    const startDate = new Date(po.plannedStartDate);
    const endDate = new Date(po.plannedEndDate);
    const snapshotDate = new Date(payload.outputDate);

    const totalDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
    const elapsedDays = Math.round((snapshotDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    let expectedProgressPercent = 0;
    if (elapsedDays >= totalDays) {
      expectedProgressPercent = 100.00;
    } else if (elapsedDays > 0) {
      expectedProgressPercent = Number(((elapsedDays / totalDays) * 100).toFixed(2));
    }

    const expectedQty = Math.round((expectedProgressPercent * po.plannedQuantity) / 100);
    const delayQuantity = Math.max(0, expectedQty - newCompleted);

    let snapshotStatus = 'ON_TRACK';
    if (newCompleted >= po.plannedQuantity) {
      snapshotStatus = 'COMPLETED';
    } else if (delayQuantity > 0) {
      if (delayQuantity <= po.plannedQuantity * 0.1) {
        snapshotStatus = 'AT_RISK';
      } else {
        snapshotStatus = 'DELAYED';
      }
    }

    const snapshotData = {
      snapshotDate: payload.outputDate,
      plannedQuantity: po.plannedQuantity,
      progressPercent: Number(((newCompleted / po.plannedQuantity) * 100).toFixed(2)),
      expectedProgressPercent: expectedProgressPercent,
      delayQuantity: delayQuantity,
      status: snapshotStatus,
    };

    try {
      const outputId = await productionOutputRepository.createOutputInTransaction({
        outputData: payload,
        employeeOutputs: payload.employeeOutputs,
        poUpdate,
        snapshotData,
        userId,
      });

      return this.getDetail(outputId);
    } catch (error) {
      if (error.message === 'GOOD_QUANTITY_EXCEEDS_PLAN') {
        throw new AppError('Số lượng hoàn thành vượt quá kế hoạch', 400, 'GOOD_QUANTITY_EXCEEDS_PLAN');
      }
      throw error;
    }
  },
};
