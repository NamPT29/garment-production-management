import { AppError } from '../utils/app-error.js';

export const validate = (schema) => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(
        new AppError('Du lieu khong hop le', 400, 'VALIDATION_ERROR', result.error.issues),
      );
    }

    req.validated = result.data;
    return next();
  };
};
