import { AppError } from '../../utils/app-error.js';
import { employeeRepository } from './employee.repository.js';

export const employeeService = {
  async list(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    return employeeRepository.findMany({ ...filters, page, limit, skip });
  },

  async getDetail(id) {
    const emp = await employeeRepository.findById(id);
    if (!emp) {
      throw new AppError('Nhân viên không tồn tại', 404, 'EMPLOYEE_NOT_FOUND');
    }
    return emp;
  },

  async create(payload, userId) {
    const existing = await employeeRepository.findByCode(payload.employeeCode);
    if (existing) {
      throw new AppError('Mã nhân viên đã tồn tại', 409, 'EMPLOYEE_CODE_DUPLICATED');
    }
    const id = await employeeRepository.create(payload, userId);
    return this.getDetail(id);
  },

  async update(id, payload) {
    await this.getDetail(id);
    return employeeRepository.update(id, payload);
  },
};
