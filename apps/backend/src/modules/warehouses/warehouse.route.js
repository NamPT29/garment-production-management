import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createWarehouse,
  deactivateWarehouse,
  getWarehouse,
  getWarehouseBalances,
  listWarehouses,
  updateWarehouse,
} from './warehouse.controller.js';
import {
  createWarehouseSchema,
  listWarehouseBalancesSchema,
  warehouseIdSchema,
  listWarehousesSchema,
  updateWarehouseSchema,
} from './warehouse.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizePermissions('WAREHOUSE_VIEW'), validate(listWarehousesSchema), listWarehouses);
router.post('/', authorizePermissions('WAREHOUSE_CREATE'), validate(createWarehouseSchema), createWarehouse);
router.get('/:id/balances', authorizePermissions('INVENTORY_VIEW'), validate(listWarehouseBalancesSchema), getWarehouseBalances);
router.get('/:id', authorizePermissions('WAREHOUSE_VIEW'), validate(warehouseIdSchema), getWarehouse);
router.patch('/:id', authorizePermissions('WAREHOUSE_UPDATE'), validate(updateWarehouseSchema), updateWarehouse);
router.patch(
  '/:id/deactivate',
  authorizePermissions('WAREHOUSE_DEACTIVATE'),
  validate(warehouseIdSchema),
  deactivateWarehouse,
);

export default router;
