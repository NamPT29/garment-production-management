import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { bomService } from './bom.service.js';

export const listBoms = asyncHandler(async (req, res) => {
  return ok(res, await bomService.list(req.validated.query), 'Lay danh sach BOM thanh cong');
});

export const createBom = asyncHandler(async (req, res) => {
  return created(
    res,
    await bomService.create(req.validated.body, req.user.id),
    'Tao BOM thanh cong',
  );
});

export const getBom = asyncHandler(async (req, res) => {
  return ok(res, await bomService.getById(req.validated.params.id), 'Lay BOM chi tiet thanh cong');
});

export const updateBom = asyncHandler(async (req, res) => {
  return ok(
    res,
    await bomService.update(req.validated.params.id, req.validated.body, req.user.id),
    'Cap nhat BOM thanh cong',
  );
});

export const activateBom = asyncHandler(async (req, res) => {
  return ok(
    res,
    await bomService.activate(req.validated.params.id),
    'Kich hoat BOM thanh cong',
  );
});

export const deactivateBom = asyncHandler(async (req, res) => {
  return ok(
    res,
    await bomService.deactivate(req.validated.params.id),
    'Ngung hoat dong BOM thanh cong',
  );
});

export const getProductBoms = asyncHandler(async (req, res) => {
  return ok(
    res,
    await bomService.getByProductId(req.validated.params.productId),
    'Lay danh sach BOM cua san pham thanh cong',
  );
});

export const getProductActiveBom = asyncHandler(async (req, res) => {
  return ok(
    res,
    await bomService.getActiveByProductId(req.validated.params.productId),
    'Lay BOM dang hoat dong cua san pham thanh cong',
  );
});
