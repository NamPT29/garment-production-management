import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productionOrderService } from './production-order.service.js';

export const listProductionOrders = asyncHandler(async (req, res) => {
  const result = await productionOrderService.list(req.validated.query);
  return ok(res, result, 'Lấy danh sách lệnh sản xuất thành công');
});

export const getProductionOrder = asyncHandler(async (req, res) => {
  const po = await productionOrderService.getDetail(req.validated.params.id);
  return ok(res, po, 'Lấy chi tiết lệnh sản xuất thành công');
});

export const createProductionOrder = asyncHandler(async (req, res) => {
  const po = await productionOrderService.create(req.validated.body, req.user.id);
  return created(res, po, 'Tạo lệnh sản xuất thành công');
});

export const updateProductionOrder = asyncHandler(async (req, res) => {
  const po = await productionOrderService.update(req.validated.params.id, req.validated.body, req.user.id);
  return ok(res, po, 'Cập nhật lệnh sản xuất thành công');
});

export const updateProductionOrderStatus = asyncHandler(async (req, res) => {
  const po = await productionOrderService.updateStatus(req.validated.params.id, req.validated.body.status, req.user.id);
  return ok(res, po, 'Cập nhật trạng thái lệnh sản xuất thành công');
});
