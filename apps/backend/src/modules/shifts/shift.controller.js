import { ok, created } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { shiftService } from './shift.service.js';

export const listShifts = asyncHandler(async (req, res) => {
  const result = await shiftService.list(req.validated.query);
  return ok(res, result, 'Lấy danh sách ca làm việc thành công');
});

export const getShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.getDetail(req.validated.params.id);
  return ok(res, shift, 'Lấy chi tiết ca làm việc thành công');
});

export const createShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.create(req.validated.body, req.user.id);
  return created(res, shift, 'Tạo ca làm việc thành công');
});

export const updateShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.update(req.validated.params.id, req.validated.body);
  return ok(res, shift, 'Cập nhật ca làm việc thành công');
});
