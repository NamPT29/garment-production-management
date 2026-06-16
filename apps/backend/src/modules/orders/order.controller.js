import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { orderService } from './order.service.js';

export const listOrders = asyncHandler(async (req, res) => {
  return ok(res, await orderService.list(req.validated.query), 'Lay danh sach don hang thanh cong');
});

export const createOrder = asyncHandler(async (req, res) => {
  return created(
    res,
    await orderService.create(req.validated.body, req.user.id),
    'Tao don hang thanh cong',
  );
});

export const getOrder = asyncHandler(async (req, res) => {
  return ok(res, await orderService.getById(req.validated.params.id), 'Lay chi tiet don hang thanh cong');
});

export const updateOrder = asyncHandler(async (req, res) => {
  return ok(
    res,
    await orderService.update(req.validated.params.id, req.validated.body, req.user.id),
    'Cap nhat don hang thanh cong',
  );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  return ok(
    res,
    await orderService.updateStatus(req.validated.params.id, req.validated.body, req.user.id),
    'Cap nhat trang thai don hang thanh cong',
  );
});

export const getOrderStatusHistory = asyncHandler(async (req, res) => {
  return ok(
    res,
    await orderService.getStatusHistory(req.validated.params.id),
    'Lay lich su trang thai thanh cong',
  );
});

export const getOrderSummary = asyncHandler(async (_req, res) => {
  return ok(res, await orderService.summary(), 'Lay thong ke don hang thanh cong');
});
