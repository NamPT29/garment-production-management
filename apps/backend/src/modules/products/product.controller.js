import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { productService } from './product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  return ok(res, await productService.list(req.validated.query), 'Lay danh sach san pham thanh cong');
});

export const createProduct = asyncHandler(async (req, res) => {
  return created(
    res,
    await productService.create(req.validated.body, req.user.id),
    'Tao san pham thanh cong',
  );
});

export const getProduct = asyncHandler(async (req, res) => {
  return ok(res, await productService.getById(req.validated.params.id), 'Lay san pham thanh cong');
});

export const updateProduct = asyncHandler(async (req, res) => {
  return ok(
    res,
    await productService.update(req.validated.params.id, req.validated.body),
    'Cap nhat san pham thanh cong',
  );
});

export const deactivateProduct = asyncHandler(async (req, res) => {
  return ok(
    res,
    await productService.deactivate(req.validated.params.id),
    'Ngung hoat dong san pham thanh cong',
  );
});
