import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productionOutputService } from './production-output.service.js';

export const listProductionOutputs = asyncHandler(async (req, res) => {
  const result = await productionOutputService.list(req.validated.query);
  return ok(res, result, 'Lấy danh sách phiếu ghi nhận sản lượng thành công');
});

export const getProductionOutput = asyncHandler(async (req, res) => {
  const result = await productionOutputService.getDetail(req.validated.params.id);
  return ok(res, result, 'Lấy chi tiết phiếu ghi nhận sản lượng thành công');
});

export const createProductionOutput = asyncHandler(async (req, res) => {
  const result = await productionOutputService.create(req.validated.body, req.user.id);
  return created(res, result, 'Báo cáo sản lượng thành công');
});
