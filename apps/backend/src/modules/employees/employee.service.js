import { AppError } from '../../utils/app-error.js';
import { employeeRepository } from './employee.repository.js';
import { productionLineRepository } from '../production-lines/production-line.repository.js';

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

  async assignToLine(employeeId, payload, userId) {
    await this.getDetail(employeeId);
    
    // Check if line exists
    const line = await productionLineRepository.findById(payload.productionLineId);
    if (!line) {
      throw new AppError('Chuyền may không tồn tại', 400, 'PRODUCTION_LINE_NOT_FOUND');
    }

    if (payload.isPrimary) {
      // Check if employee already has an active primary assignment
      const activePrimary = await employeeRepository.getActivePrimaryAssignment(employeeId);
      if (activePrimary) {
        throw new AppError(
          `Nhân viên đã được phân công chính vào chuyền may khác`,
          400,
          'DUAL_PRIMARY_ASSIGNMENT_BLOCKED'
        );
      }
    }

    const id = await employeeRepository.assignToLine(
      {
        ...payload,
        employeeId,
      },
      userId
    );
    
    return { assignmentId: id };
  },

  async getAssignmentHistory(employeeId) {
    await this.getDetail(employeeId);
    return employeeRepository.getAssignmentHistory(employeeId);
  },

  async endAssignment(employeeId, assignmentId, payload) {
    await this.getDetail(employeeId);
    
    const histories = await employeeRepository.getAssignmentHistory(employeeId);
    const assign = histories.find(h => h.id === Number(assignmentId));
    if (!assign) {
      throw new AppError('Không tìm thấy lịch sử phân công', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    const endDate = payload.assignedTo || new Date().toISOString().slice(0, 10);
    await employeeRepository.endActiveAssignment(assignmentId, endDate);
    return { success: true };
  },
};
