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

const router = Router();

router.use(authenticate);

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
