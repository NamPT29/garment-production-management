import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  activateBom,
  createBom,
  deactivateBom,
  getBom,
  listBoms,
  updateBom,
} from './bom.controller.js';
import {
  createBomSchema,
  bomIdSchema,
  listBomsSchema,
  updateBomSchema,
} from './bom.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizePermissions('BOM_VIEW'), validate(listBomsSchema), listBoms);
router.post('/', authorizePermissions('BOM_CREATE'), validate(createBomSchema), createBom);
router.get('/:id', authorizePermissions('BOM_VIEW'), validate(bomIdSchema), getBom);
router.patch('/:id', authorizePermissions('BOM_UPDATE'), validate(updateBomSchema), updateBom);
router.patch('/:id/activate', authorizePermissions('BOM_ACTIVATE'), validate(bomIdSchema), activateBom);
router.patch('/:id/deactivate', authorizePermissions('BOM_DEACTIVATE'), validate(bomIdSchema), deactivateBom);

export default router;
