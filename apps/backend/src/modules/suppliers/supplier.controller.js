import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { supplierService } from './supplier.service.js';

export const listSuppliers = asyncHandler(async (req, res) => {
  return ok(res, await supplierService.list(req.validated.query), 'Lay danh sach nha cung cap thanh cong');
});

export const createSupplier = asyncHandler(async (req, res) => {
  return created(
    res,
    await supplierService.create(req.validated.body, req.user.id),
    'Tao nha cung cap thanh cong',
  );
});

export const getSupplier = asyncHandler(async (req, res) => {
  return ok(res, await supplierService.getById(req.validated.params.id), 'Lay nha cung cap chi tiet thanh cong');
});

export const updateSupplier = asyncHandler(async (req, res) => {
  return ok(
    res,
    await supplierService.update(req.validated.params.id, req.validated.body),
    'Cap nhat nha cung cap thanh cong',
  );
});

export const deactivateSupplier = asyncHandler(async (req, res) => {
  return ok(
    res,
    await supplierService.deactivate(req.validated.params.id),
    'Ngung hoat dong nha cung cap thanh cong',
  );
});
