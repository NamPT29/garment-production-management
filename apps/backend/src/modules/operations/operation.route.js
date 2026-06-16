import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  addProductOperation,
  createOperation,
  getOperation,
  getProductOperations,
  listOperations,
  removeProductOperation,
  updateOperation,
  updateProductOperation,
} from './operation.controller.js';
import {
  addProductOperationSchema,
  createOperationSchema,
  getOperationSchema,
  getProductOperationsSchema,
  listOperationsSchema,
  removeProductOperationSchema,
  updateOperationSchema,
  updateProductOperationSchema,
} from './operation.validation.js';

const router = Router();

router.use(authenticate);

// Standard operations CRUD
router.get(
  '/',
  authorizePermissions('OPERATION_VIEW'),
  validate(listOperationsSchema),
  listOperations
);

router.post(
  '/',
  authorizePermissions('OPERATION_CREATE'),
  validate(createOperationSchema),
  createOperation
);

router.get(
  '/:id',
  authorizePermissions('OPERATION_VIEW'),
  validate(getOperationSchema),
  getOperation
);

router.put(
  '/:id',
  authorizePermissions('OPERATION_UPDATE'),
  validate(updateOperationSchema),
  updateOperation
);

// Product operations flow management (nested routes or standalone)
// /api/v1/products/:productId/operations
router.get(
  '/products/:productId/operations',
  authorizePermissions('OPERATION_VIEW'),
  validate(getProductOperationsSchema),
  getProductOperations
);

router.post(
  '/products/:productId/operations',
  authorizePermissions('PRODUCT_OPERATION_MANAGE'),
  validate(addProductOperationSchema),
  addProductOperation
);

router.put(
  '/products/:productId/operations/:productOperationId',
  authorizePermissions('PRODUCT_OPERATION_MANAGE'),
  validate(updateProductOperationSchema),
  updateProductOperation
);

router.delete(
  '/products/:productId/operations/:productOperationId',
  authorizePermissions('PRODUCT_OPERATION_MANAGE'),
  validate(removeProductOperationSchema),
  removeProductOperation
);

export default router;
