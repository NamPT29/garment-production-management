import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productionPlanService } from './production-plan.service.js';

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
