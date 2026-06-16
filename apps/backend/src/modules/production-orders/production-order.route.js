import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createProductionOrder,
  getProductionOrder,
  listProductionOrders,
  updateProductionOrder,
  updateProductionOrderStatus,
} from './production-order.controller.js';
import {
  createProductionOrderSchema,
  getProductionOrderSchema,
  listProductionOrdersSchema,
  updateProductionOrderSchema,
  updateProductionOrderStatusSchema,
} from './production-order.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('PRODUCTION_ORDER_VIEW'),
  validate(listProductionOrdersSchema),
  listProductionOrders
);

router.post(
  '/',
  authorizePermissions('PRODUCTION_ORDER_CREATE'),
  validate(createProductionOrderSchema),
  createProductionOrder
);

router.get(
  '/:id',
  authorizePermissions('PRODUCTION_ORDER_VIEW'),
  validate(getProductionOrderSchema),
  getProductionOrder
);

router.put(
  '/:id',
  authorizePermissions('PRODUCTION_ORDER_UPDATE'),
  validate(updateProductionOrderSchema),
  updateProductionOrder
);

router.patch(
  '/:id/status',
  authorizePermissions('PRODUCTION_ORDER_RELEASE'),
  validate(updateProductionOrderStatusSchema),
  updateProductionOrderStatus
);

export default router;
