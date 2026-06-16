import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createCustomer,
  deactivateCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from './customer.controller.js';
import {
  createCustomerSchema,
  customerIdSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from './customer.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizePermissions('CUSTOMER_VIEW'), validate(listCustomersSchema), listCustomers);
router.post('/', authorizePermissions('CUSTOMER_CREATE'), validate(createCustomerSchema), createCustomer);
router.get('/:id', authorizePermissions('CUSTOMER_VIEW'), validate(customerIdSchema), getCustomer);
router.patch('/:id', authorizePermissions('CUSTOMER_UPDATE'), validate(updateCustomerSchema), updateCustomer);
router.patch(
  '/:id/deactivate',
  authorizePermissions('CUSTOMER_DEACTIVATE'),
  validate(customerIdSchema),
  deactivateCustomer,
);

export default router;
