import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { operationService } from './operation.service.js';

export const listOperations = asyncHandler(async (req, res) => {
  const result = await operationService.list(req.validated.query);
  return ok(res, result, 'Lấy danh sách công đoạn thành công');
});

export const getOperation = asyncHandler(async (req, res) => {
  const op = await operationService.getDetail(req.validated.params.id);
  return ok(res, op, 'Lấy chi tiết công đoạn thành công');
});

export const createOperation = asyncHandler(async (req, res) => {
  const op = await operationService.create(req.validated.body, req.user.id);
  return created(res, op, 'Tạo công đoạn thành công');
});

export const updateOperation = asyncHandler(async (req, res) => {
  const op = await operationService.update(req.validated.params.id, req.validated.body);
  return ok(res, op, 'Cập nhật công đoạn thành công');
});

// Product operations flow
export const getProductOperations = asyncHandler(async (req, res) => {
  const result = await operationService.getProductOperations(req.validated.params.productId);
  return ok(res, result, 'Lấy quy trình công đoạn sản phẩm thành công');
});

export const addProductOperation = asyncHandler(async (req, res) => {
  const result = await operationService.addProductOperation(req.validated.params.productId, req.validated.body);
  return created(res, result, 'Thêm công đoạn vào sản phẩm thành công');
});

export const updateProductOperation = asyncHandler(async (req, res) => {
  const result = await operationService.updateProductOperation(
    req.validated.params.productId,
    req.validated.params.productOperationId,
    req.validated.body
  );
  return ok(res, result, 'Cập nhật công đoạn sản phẩm thành công');
});

export const removeProductOperation = asyncHandler(async (req, res) => {
  const result = await operationService.removeProductOperation(
    req.validated.params.productId,
    req.validated.params.productOperationId
  );
  return ok(res, result, 'Xóa công đoạn khỏi sản phẩm thành công');
});
