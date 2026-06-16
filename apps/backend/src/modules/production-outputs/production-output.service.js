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
      throw new AppError(
        'Chỉ có thể ghi nhận sản lượng cho lệnh sản xuất đang hoạt động (RELEASED, IN_PROGRESS, PAUSED)',
        400,
        'PRODUCTION_ORDER_NOT_ACTIVE'
      );
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

    // Xác định trạng thái tiếp theo cho lệnh sản xuất
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

    try {
      const outputId = await productionOutputRepository.createOutputInTransaction({
        outputData: payload,
        poUpdate,
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
