import { AppError } from '../utils/app-error.js';

export const notFoundMiddleware = (req, _res, next) => {
  next(new AppError(`Khong tim thay API ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};
