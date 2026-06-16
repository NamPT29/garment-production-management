import { AppError } from '../utils/app-error.js';

export const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    const userRoles = req.user?.roles ?? [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(new AppError('Khong co quyen thuc hien thao tac', 403, 'FORBIDDEN'));
    }

    return next();
  };
};

export const authorizePermissions = (...permissions) => {
  return (req, _res, next) => {
    const userPermissions = req.user?.permissions ?? [];

    // Wildcard '*' grants all permissions (e.g. ADMIN role)
    if (userPermissions.includes('*')) {
      return next();
    }

    const hasPermission = permissions.every((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      return next(new AppError('Khong co quyen thuc hien thao tac', 403, 'FORBIDDEN'));
    }

    return next();
  };
};
