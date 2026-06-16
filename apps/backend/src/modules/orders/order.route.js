import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createOrder,
  getOrder,
  getOrderStatusHistory,
  getOrderSummary,
  listOrders,
  updateOrder,
  updateOrderStatus,
} from './order.controller.js';
import { getMaterialRequirements } from '../material-requirements/material-requirement.controller.js';
import {
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
} from './order.validation.js';

const router = Router();

router.use(authenticate);

router.get('/summary', authorizePermissions('ORDER_VIEW'), getOrderSummary);
router.get('/', authorizePermissions('ORDER_VIEW'), validate(listOrdersSchema), listOrders);
router.post('/', authorizePermissions('ORDER_CREATE'), validate(createOrderSchema), createOrder);
router.get('/:id/material-requirements', authorizePermissions('MATERIAL_REQUIREMENT_VIEW'), validate(orderIdSchema), getMaterialRequirements);
router.get('/:id', authorizePermissions('ORDER_VIEW'), validate(orderIdSchema), getOrder);
router.patch('/:id', authorizePermissions('ORDER_UPDATE'), validate(updateOrderSchema), updateOrder);
router.patch(
  '/:id/status',
  authorizePermissions('ORDER_STATUS_UPDATE'),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);
router.get(
  '/:id/status-history',
  authorizePermissions('ORDER_VIEW'),
  validate(orderIdSchema),
  getOrderStatusHistory,
);

export default router;
