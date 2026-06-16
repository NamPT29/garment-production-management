import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createShift,
  getShift,
  listShifts,
  updateShift,
} from './shift.controller.js';
import {
  createShiftSchema,
  getShiftSchema,
  listShiftsSchema,
  updateShiftSchema,
} from './shift.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('SHIFT_VIEW'),
  validate(listShiftsSchema),
  listShifts
);

router.post(
  '/',
  authorizePermissions('SHIFT_CREATE'),
  validate(createShiftSchema),
  createShift
);

router.get(
  '/:id',
  authorizePermissions('SHIFT_VIEW'),
  validate(getShiftSchema),
  getShift
);

router.put(
  '/:id',
  authorizePermissions('SHIFT_UPDATE'),
  validate(updateShiftSchema),
  updateShift
);

export default router;
