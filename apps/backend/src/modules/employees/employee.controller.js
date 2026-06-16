import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { employeeService } from './employee.service.js';

export const listEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.list(req.validated.query);
  return ok(res, result, 'Lấy danh sách nhân viên thành công');
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getDetail(req.validated.params.id);
  return ok(res, employee, 'Lấy chi tiết nhân viên thành công');
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.create(req.validated.body, req.user.id);
  return created(res, employee, 'Tạo nhân viên thành công');
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.update(req.validated.params.id, req.validated.body);
  return ok(res, employee, 'Cập nhật nhân viên thành công');
});

export const assignToLine = asyncHandler(async (req, res) => {
  const result = await employeeService.assignToLine(req.validated.params.id, req.validated.body, req.user.id);
  return created(res, result, 'Phân công nhân viên vào chuyền thành công');
});

export const getAssignmentHistory = asyncHandler(async (req, res) => {
  const history = await employeeService.getAssignmentHistory(req.validated.params.id);
  return ok(res, history, 'Lấy lịch sử phân công thành công');
});

export const endAssignment = asyncHandler(async (req, res) => {
  const result = await employeeService.endAssignment(req.validated.params.id, req.params.assignmentId, req.body);
  return ok(res, result, 'Kết thúc phân công thành công');
});
