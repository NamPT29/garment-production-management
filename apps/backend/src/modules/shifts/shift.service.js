import { AppError } from '../../utils/app-error.js';
import { shiftRepository } from './shift.repository.js';

export const shiftService = {
  async list(filters) {
    return shiftRepository.findAll(filters);
  },

  async getDetail(id) {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      throw new AppError('Ca làm việc không tồn tại', 404, 'SHIFT_NOT_FOUND');
    }
    return shift;
  },

  async create(payload, userId) {
    const existing = await shiftRepository.findByCode(payload.shiftCode);
    if (existing) {
      throw new AppError('Mã ca làm việc đã tồn tại', 409, 'SHIFT_CODE_DUPLICATED');
    }
    if (payload.startTime === payload.endTime) {
      throw new AppError('Giờ bắt đầu và kết thúc không được trùng nhau', 400, 'SHIFT_TIME_INVALID');
    }
    const id = await shiftRepository.create(payload, userId);
    return this.getDetail(id);
  },

  async update(id, payload) {
    await this.getDetail(id);
    if (payload.startTime === payload.endTime) {
      throw new AppError('Giờ bắt đầu và kết thúc không được trùng nhau', 400, 'SHIFT_TIME_INVALID');
    }
    return shiftRepository.update(id, payload);
  },
};
