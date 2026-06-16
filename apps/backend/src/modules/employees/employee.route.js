import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from './employee.controller.js';
import {
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

export default router;
