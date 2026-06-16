import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createProduct,
  deactivateProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './product.controller.js';
import {
  createProductSchema,
  listProductsSchema,
  productIdSchema,
  updateProductSchema,
} from './product.validation.js';

import { getProductBoms, getProductActiveBom } from '../boms/bom.controller.js';
import { productIdSchema as productBomIdSchema } from '../boms/bom.validation.js';

const router = Router();

router.use(authenticate);

router.get('/:productId/boms', authorizePermissions('BOM_VIEW'), validate(productBomIdSchema), getProductBoms);
router.get('/:productId/active-bom', authorizePermissions('BOM_VIEW'), validate(productBomIdSchema), getProductActiveBom);

router.get('/', authorizePermissions('PRODUCT_VIEW'), validate(listProductsSchema), listProducts);
router.post('/', authorizePermissions('PRODUCT_CREATE'), validate(createProductSchema), createProduct);
router.get('/:id', authorizePermissions('PRODUCT_VIEW'), validate(productIdSchema), getProduct);
router.patch('/:id', authorizePermissions('PRODUCT_UPDATE'), validate(updateProductSchema), updateProduct);
router.patch(
  '/:id/deactivate',
  authorizePermissions('PRODUCT_DEACTIVATE'),
  validate(productIdSchema),
  deactivateProduct,
);

export default router;
