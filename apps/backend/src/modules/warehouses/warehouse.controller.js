import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { warehouseService } from './warehouse.service.js';

export const listWarehouses = asyncHandler(async (req, res) => {
  return ok(res, await warehouseService.list(req.validated.query), 'Lay danh sach kho thanh cong');
});

export const createWarehouse = asyncHandler(async (req, res) => {
  return created(
    res,
    await warehouseService.create(req.validated.body, req.user.id),
    'Tao kho thanh cong',
  );
});

export const getWarehouse = asyncHandler(async (req, res) => {
  return ok(res, await warehouseService.getById(req.validated.params.id), 'Lay kho chi tiet thanh cong');
});

export const getWarehouseBalances = asyncHandler(async (req, res) => {
  return ok(
    res,
    await warehouseService.getBalances(req.validated.params.id, req.validated.query),
    'Lay danh sach ton kho cua kho thanh cong',
  );
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  return ok(
    res,
    await warehouseService.update(req.validated.params.id, req.validated.body),
    'Cap nhat kho thanh cong',
  );
});

export const deactivateWarehouse = asyncHandler(async (req, res) => {
  return ok(
    res,
    await warehouseService.deactivate(req.validated.params.id),
    'Ngung hoat dong kho thanh cong',
  );
});
