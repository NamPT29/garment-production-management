import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createMaterial,
  deactivateMaterial,
  getMaterial,
  listMaterials,
  updateMaterial,
} from './material.controller.js';
import {
  createMaterialSchema,
  materialIdSchema,
  listMaterialsSchema,
  updateMaterialSchema,
} from './material.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorizePermissions('MATERIAL_VIEW'), validate(listMaterialsSchema), listMaterials);
router.post('/', authorizePermissions('MATERIAL_CREATE'), validate(createMaterialSchema), createMaterial);
router.get('/:id', authorizePermissions('MATERIAL_VIEW'), validate(materialIdSchema), getMaterial);
router.patch('/:id', authorizePermissions('MATERIAL_UPDATE'), validate(updateMaterialSchema), updateMaterial);
router.patch(
  '/:id/deactivate',
  authorizePermissions('MATERIAL_DEACTIVATE'),
  validate(materialIdSchema),
  deactivateMaterial,
);

export default router;
