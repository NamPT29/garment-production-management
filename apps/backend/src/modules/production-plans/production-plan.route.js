import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  assignEmployeeToSchedule,
  createAllocation,
  createSchedule,
  getAllocation,
  getSchedule,
  getScheduleAssignments,
  listAllocations,
  listSchedules,
  removeEmployeeFromSchedule,
  updateAllocation,
  updateSchedule,
} from './production-plan.controller.js';
import {
  assignScheduleEmployeeSchema,
  createAllocationSchema,
  createScheduleSchema,
  getAllocationSchema,
  getScheduleSchema,
  listAllocationsSchema,
  listSchedulesSchema,
  removeScheduleEmployeeSchema,
  updateAllocationSchema,
  updateScheduleSchema,
} from './production-plan.validation.js';

const router = Router();

router.use(authenticate);

// Allocations
router.get(
  '/allocations',
  authorizePermissions('PRODUCTION_PLAN_VIEW'),
  validate(listAllocationsSchema),
  listAllocations
);

router.post(
  '/allocations',
  authorizePermissions('PRODUCTION_PLAN_CREATE'),
  validate(createAllocationSchema),
  createAllocation
);

router.get(
  '/allocations/:id',
  authorizePermissions('PRODUCTION_PLAN_VIEW'),
  validate(getAllocationSchema),
  getAllocation
);

router.put(
  '/allocations/:id',
  authorizePermissions('PRODUCTION_PLAN_UPDATE'),
  validate(updateAllocationSchema),
  updateAllocation
);

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

// Worker Shift Assignments nested in Schedules
router.get(
  '/schedules/:id/assignments',
  authorizePermissions('PRODUCTION_PLAN_VIEW'),
  validate(getScheduleSchema),
  getScheduleAssignments
);

router.post(
  '/schedules/:id/assignments',
  authorizePermissions('PRODUCTION_PLAN_ASSIGN_EMPLOYEE'),
  validate(assignScheduleEmployeeSchema),
  assignEmployeeToSchedule
);

router.delete(
  '/schedules/:id/assignments/:assignmentId',
  authorizePermissions('PRODUCTION_PLAN_ASSIGN_EMPLOYEE'),
  validate(removeScheduleEmployeeSchema),
  removeEmployeeFromSchedule
);

export default router;
