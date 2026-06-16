import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createProductionLine,
  getActiveEmployees,
  getProductionLine,
  listProductionLines,
  updateProductionLine,
} from './production-line.controller.js';
import {
  createProductionLineSchema,
  getProductionLineSchema,
  listProductionLinesSchema,
  updateProductionLineSchema,
} from './production-line.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('PRODUCTION_LINE_VIEW'),
  validate(listProductionLinesSchema),
  listProductionLines
);

router.post(
  '/',
  authorizePermissions('PRODUCTION_LINE_CREATE'),
  validate(createProductionLineSchema),
  createProductionLine
);

router.get(
  '/:id',
  authorizePermissions('PRODUCTION_LINE_VIEW'),
  validate(getProductionLineSchema),
  getProductionLine
);

router.put(
  '/:id',
  authorizePermissions('PRODUCTION_LINE_UPDATE'),
  validate(updateProductionLineSchema),
  updateProductionLine
);

router.get(
  '/:id/employees',
  authorizePermissions('PRODUCTION_LINE_VIEW'),
  validate(getProductionLineSchema),
  getActiveEmployees
);

export default router;
