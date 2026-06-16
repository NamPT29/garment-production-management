import { ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productionProgressService } from './production-progress.service.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const result = await productionProgressService.getDashboardSummary();
  return ok(res, result, 'Lấy tóm tắt dashboard sản xuất thành công');
});

export const getLineEfficiency = asyncHandler(async (req, res) => {
  const result = await productionProgressService.getLineEfficiency();
  return ok(res, result, 'Lấy hiệu suất chuyền may thành công');
});

export const getWorkerProductivity = asyncHandler(async (req, res) => {
  const result = await productionProgressService.getWorkerProductivity();
  return ok(res, result, 'Lấy năng suất nhân sự thành công');
});

export const getLatestProgressSnapshots = asyncHandler(async (req, res) => {
  const result = await productionProgressService.getLatestProgressSnapshots();
  return ok(res, result, 'Lấy tiến độ các lệnh sản xuất thành công');
});

export const getProgressHistory = asyncHandler(async (req, res) => {
  const result = await productionProgressService.getProgressHistory(req.validated.params.id);
  return ok(res, result, 'Lấy lịch sử tiến độ lệnh sản xuất thành công');
});
