import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createSupplier,
  deactivateSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from './supplier.controller.js';
import {
  createSupplierSchema,
  supplierIdSchema,
  listSuppliersSchema,
  updateSupplierSchema,
} from './supplier.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizePermissions('SUPPLIER_VIEW'), validate(listSuppliersSchema), listSuppliers);
router.post('/', authorizePermissions('SUPPLIER_CREATE'), validate(createSupplierSchema), createSupplier);
router.get('/:id', authorizePermissions('SUPPLIER_VIEW'), validate(supplierIdSchema), getSupplier);
router.patch('/:id', authorizePermissions('SUPPLIER_UPDATE'), validate(updateSupplierSchema), updateSupplier);
router.patch(
  '/:id/deactivate',
  authorizePermissions('SUPPLIER_DEACTIVATE'),
  validate(supplierIdSchema),
  deactivateSupplier,
);

export default router;
