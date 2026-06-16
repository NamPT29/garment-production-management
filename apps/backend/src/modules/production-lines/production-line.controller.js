import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productionLineService } from './production-line.service.js';

export const listProductionLines = asyncHandler(async (req, res) => {
  const lines = await productionLineService.list(req.validated.query);
  return ok(res, lines, 'Lấy danh sách chuyền may thành công');
});

export const getProductionLine = asyncHandler(async (req, res) => {
  const line = await productionLineService.getDetail(req.validated.params.id);
  return ok(res, line, 'Lấy chi tiết chuyền may thành công');
});

export const createProductionLine = asyncHandler(async (req, res) => {
  const line = await productionLineService.create(req.validated.body, req.user.id);
  return created(res, line, 'Tạo chuyền may thành công');
});

export const updateProductionLine = asyncHandler(async (req, res) => {
  const line = await productionLineService.update(req.validated.params.id, req.validated.body);
  return ok(res, line, 'Cập nhật chuyền may thành công');
});

export const getActiveEmployees = asyncHandler(async (req, res) => {
  const employees = await productionLineService.getActiveEmployees(req.validated.params.id);
  return ok(res, employees, 'Lấy danh sách công nhân đang hoạt động trong chuyền thành công');
});
