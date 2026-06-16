import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createSchedule,
  getSchedule,
  listSchedules,
  updateSchedule,
} from './production-plan.controller.js';
import {
  createScheduleSchema,
  getScheduleSchema,
  listSchedulesSchema,
  updateScheduleSchema,
} from './production-plan.validation.js';

const router = Router();

router.use(authenticate);

// Schedules
router.get(
  '/schedules',
  authorizePermissions('PRODUCTION_PLAN_VIEW'),
  validate(listSchedulesSchema),
  listSchedules
);

router.post(
  '/schedules',
  authorizePermissions('PRODUCTION_PLAN_CREATE'),
  validate(createScheduleSchema),
  createSchedule
);

router.get(
  '/schedules/:id',
  authorizePermissions('PRODUCTION_PLAN_VIEW'),
  validate(getScheduleSchema),
  getSchedule
);

router.put(
  '/schedules/:id',
  authorizePermissions('PRODUCTION_PLAN_UPDATE'),
  validate(updateScheduleSchema),
  updateSchedule
);

export default router;
