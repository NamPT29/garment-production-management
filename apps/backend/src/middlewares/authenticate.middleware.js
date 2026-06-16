import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../modules/users/user.repository.js';
import { AppError } from '../utils/app-error.js';

export const authenticate = async (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError('Chua dang nhap hoac token khong hop le', 401, 'UNAUTHORIZED'));
  }

  try {
    const token = authorization.slice('Bearer '.length);
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await userRepository.findByIdWithAccess(payload.userId);

    if (!user) {
      return next(new AppError('Tai khoan khong ton tai', 401, 'USER_NOT_FOUND'));
    }

    if (user.isLocked) {
      return next(new AppError('Tai khoan da bi khoa', 403, 'USER_LOCKED'));
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      permissions: user.permissions,
    };
    return next();
  } catch {
    return next(new AppError('Token khong hop le hoac da het han', 401, 'INVALID_TOKEN'));
  }
};
