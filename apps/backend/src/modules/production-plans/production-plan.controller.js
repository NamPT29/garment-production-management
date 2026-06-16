import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productionPlanService } from './production-plan.service.js';

// Allocations
export const listAllocations = asyncHandler(async (req, res) => {
  const result = await productionPlanService.listAllocations(req.validated.query);
  return ok(res, result, 'Lấy danh sách phân bổ sản xuất thành công');
});

export const getAllocation = asyncHandler(async (req, res) => {
  const result = await productionPlanService.getAllocationDetail(req.validated.params.id);
  return ok(res, result, 'Lấy chi tiết phân bổ sản xuất thành công');
});

export const createAllocation = asyncHandler(async (req, res) => {
  const result = await productionPlanService.createAllocation(req.validated.body, req.user.id);
  return created(res, result, 'Tạo phân bổ sản xuất thành công');
});

export const updateAllocation = asyncHandler(async (req, res) => {
  const result = await productionPlanService.updateAllocation(req.validated.params.id, req.validated.body);
  return ok(res, result, 'Cập nhật phân bổ sản xuất thành công');
});

// Schedules
export const listSchedules = asyncHandler(async (req, res) => {
  const result = await productionPlanService.listSchedules(req.validated.query);
  return ok(res, result, 'Lấy danh sách kế hoạch sản xuất thành công');
});

export const getSchedule = asyncHandler(async (req, res) => {
  const result = await productionPlanService.getScheduleDetail(req.validated.params.id);
  return ok(res, result, 'Lấy chi tiết kế hoạch sản xuất thành công');
});

export const createSchedule = asyncHandler(async (req, res) => {
  const result = await productionPlanService.createSchedule(req.validated.body, req.user.id);
  return created(res, result, 'Tạo kế hoạch sản xuất thành công');
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const result = await productionPlanService.updateSchedule(req.validated.params.id, req.validated.body, req.user.id);
  return ok(res, result, 'Cập nhật kế hoạch sản xuất thành công');
});

// Worker Assignments
export const getScheduleAssignments = asyncHandler(async (req, res) => {
  const result = await productionPlanService.getScheduleAssignments(req.validated.params.id);
  return ok(res, result, 'Lấy danh sách phân công công việc ca thành công');
});

export const assignEmployeeToSchedule = asyncHandler(async (req, res) => {
  const result = await productionPlanService.assignEmployeeToSchedule(
    req.validated.params.id,
    req.validated.body,
    req.user.id
  );
  return created(res, result, 'Phân công nhân viên vào ca thành công');
});

export const removeEmployeeFromSchedule = asyncHandler(async (req, res) => {
  const result = await productionPlanService.removeEmployeeFromSchedule(
    req.validated.params.id,
    req.validated.params.assignmentId
  );
  return ok(res, result, 'Xóa nhân viên khỏi ca thành công');
});
