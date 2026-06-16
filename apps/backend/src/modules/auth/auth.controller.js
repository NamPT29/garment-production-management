import { ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authService } from './auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.validated.body);
  return ok(res, data, 'Dang nhap thanh cong');
});

export const getMe = asyncHandler(async (req, res) => {
  return ok(res, authService.getMe(req.user), 'Lay thong tin nguoi dung thanh cong');
});

export const logout = asyncHandler(async (_req, res) => {
  return ok(res, authService.logout(), 'Dang xuat thanh cong');
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user.id, req.validated.body);
  return ok(res, data, 'Doi mat khau thanh cong');
});

export const permissionCheck = asyncHandler(async (req, res) => {
  return ok(
    res,
    {
      user: req.user.username,
      permissions: req.user.permissions,
    },
    'Middleware phan quyen hoat dong',
  );
});
