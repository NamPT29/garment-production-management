import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createProductionOutput,
  getProductionOutput,
  listProductionOutputs,
} from './production-output.controller.js';
import {
  createProductionOutputSchema,
  getProductionOutputSchema,
  listProductionOutputsSchema,
} from './production-output.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('PRODUCTION_OUTPUT_VIEW'),
  validate(listProductionOutputsSchema),
  listProductionOutputs
);

router.post(
  '/',
  authorizePermissions('PRODUCTION_OUTPUT_CREATE'),
  validate(createProductionOutputSchema),
  createProductionOutput
);

router.get(
  '/:id',
  authorizePermissions('PRODUCTION_OUTPUT_VIEW'),
  validate(getProductionOutputSchema),
  getProductionOutput
);

export default router;
