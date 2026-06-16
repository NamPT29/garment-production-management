import { env } from '../config/env.js';

export const errorMiddleware = (error, req, res, _next) => {
  const statusCode = error.statusCode ?? 500;
  const payload = {
    success: false,
    statusCode,
    errorCode: error.errorCode ?? 'INTERNAL_ERROR',
    message: error.message ?? 'Loi xu ly phia may chu',
    details: error.details ?? [],
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (env.NODE_ENV !== 'production' && error.stack) {
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
};
