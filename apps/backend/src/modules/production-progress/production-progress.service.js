import { AppError } from '../../utils/app-error.js';
import { productionProgressRepository } from './production-progress.repository.js';
import { productionOrderRepository } from '../production-orders/production-order.repository.js';

export const productionProgressService = {
  async getDashboardSummary() {
    return productionProgressRepository.getDashboardSummary();
  },

  async getLineEfficiency() {
    return productionProgressRepository.getLineEfficiency();
  },

  async getWorkerProductivity() {
    return productionProgressRepository.getWorkerProductivity();
  },

  async getLatestProgressSnapshots() {
    return productionProgressRepository.getLatestProgressSnapshots();
  },

  async getProgressHistory(orderId) {
    const po = await productionOrderRepository.findById(orderId);
    if (!po) {
      throw new AppError('Lệnh sản xuất không tồn tại', 404, 'PRODUCTION_ORDER_NOT_FOUND');
    }
    return productionProgressRepository.getProgressHistoryByOrder(orderId);
  },
};
