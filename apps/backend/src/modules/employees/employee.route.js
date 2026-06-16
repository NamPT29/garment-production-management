import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  assignToLine,
  createEmployee,
  endAssignment,
  getAssignmentHistory,
  getEmployee,
  listEmployees,
  updateEmployee,
} from './employee.controller.js';
import {
  assignLineSchema,
  createEmployeeSchema,
  getEmployeeSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
} from './employee.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('EMPLOYEE_VIEW'),
  validate(listEmployeesSchema),
  listEmployees
);

router.post(
  '/',
  authorizePermissions('EMPLOYEE_CREATE'),
  validate(createEmployeeSchema),
  createEmployee
);

router.get(
  '/:id',
  authorizePermissions('EMPLOYEE_VIEW'),
  validate(getEmployeeSchema),
  getEmployee
);

router.put(
  '/:id',
  authorizePermissions('EMPLOYEE_UPDATE'),
  validate(updateEmployeeSchema),
  updateEmployee
);

router.post(
  '/:id/assign-line',
  authorizePermissions('EMPLOYEE_ASSIGN_LINE'),
  validate(assignLineSchema),
  assignToLine
);

router.get(
  '/:id/assignments',
  authorizePermissions('EMPLOYEE_VIEW'),
  validate(getEmployeeSchema),
  getAssignmentHistory
);

router.put(
  '/:id/assignments/:assignmentId/end',
  authorizePermissions('EMPLOYEE_ASSIGN_LINE'),
  validate(getEmployeeSchema),
  endAssignment
);

export default router;
