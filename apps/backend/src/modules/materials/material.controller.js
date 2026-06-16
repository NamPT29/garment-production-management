import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { materialService } from './material.service.js';

export const listMaterials = asyncHandler(async (req, res) => {
  return ok(res, await materialService.list(req.validated.query), 'Lay danh sach nguyen phu lieu thanh cong');
});

export const createMaterial = asyncHandler(async (req, res) => {
  return created(
    res,
    await materialService.create(req.validated.body, req.user.id),
    'Tao nguyen phu lieu thanh cong',
  );
});

export const getMaterial = asyncHandler(async (req, res) => {
  return ok(res, await materialService.getById(req.validated.params.id), 'Lay nguyen phu lieu chi tiet thanh cong');
});

export const updateMaterial = asyncHandler(async (req, res) => {
  return ok(
    res,
    await materialService.update(req.validated.params.id, req.validated.body),
    'Cap nhat nguyen phu lieu thanh cong',
  );
});

export const deactivateMaterial = asyncHandler(async (req, res) => {
  return ok(
    res,
    await materialService.deactivate(req.validated.params.id),
    'Ngung hoat dong nguyen phu lieu thanh cong',
  );
});
