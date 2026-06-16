import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  changePassword,
  getMe,
  login,
  logout,
  permissionCheck,
} from './auth.controller.js';
import { changePasswordSchema, loginSchema } from './auth.validation.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/permission-check', authenticate, authorizePermissions('USER_CREATE'), permissionCheck);

export default router;
