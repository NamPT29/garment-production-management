import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { customerService } from './customer.service.js';

export const listCustomers = asyncHandler(async (req, res) => {
  return ok(res, await customerService.list(req.validated.query), 'Lay danh sach khach hang thanh cong');
});

export const createCustomer = asyncHandler(async (req, res) => {
  return created(
    res,
    await customerService.create(req.validated.body, req.user.id),
    'Tao khach hang thanh cong',
  );
});

export const getCustomer = asyncHandler(async (req, res) => {
  return ok(res, await customerService.getById(req.validated.params.id), 'Lay khach hang thanh cong');
});

export const updateCustomer = asyncHandler(async (req, res) => {
  return ok(
    res,
    await customerService.update(req.validated.params.id, req.validated.body),
    'Cap nhat khach hang thanh cong',
  );
});

export const deactivateCustomer = asyncHandler(async (req, res) => {
  return ok(
    res,
    await customerService.deactivate(req.validated.params.id),
    'Ngung hoat dong khach hang thanh cong',
  );
});
