import { AppError } from '../../utils/app-error.js';
import { productionLineRepository } from './production-line.repository.js';

export const productionLineService = {
  async list(filters) {
    return productionLineRepository.findAll(filters);
  },

  async getDetail(id) {
    const line = await productionLineRepository.findById(id);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 404, 'PRODUCTION_LINE_NOT_FOUND');
    }
    return line;
  },

  async create(payload, userId) {
    const existing = await productionLineRepository.findByCode(payload.lineCode);
    if (existing) {
      throw new AppError('Mã chuyền đã tồn tại', 409, 'PRODUCTION_LINE_CODE_DUPLICATED');
    }
    const id = await productionLineRepository.create(payload, userId);
    return this.getDetail(id);
  },

  async update(id, payload) {
    await this.getDetail(id);
    return productionLineRepository.update(id, payload);
  },

  async getActiveEmployees(id) {
    await this.getDetail(id);
    return productionLineRepository.getActiveEmployees(id);
  },
};
