import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getDashboardSummary,
  getLatestProgressSnapshots,
  getLineEfficiency,
  getProgressHistory,
  getWorkerProductivity,
} from './production-progress.controller.js';
import { getProgressHistorySchema } from './production-progress.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorizePermissions('PRODUCTION_DASHBOARD_VIEW'),
  getDashboardSummary
);

router.get(
  '/lines-efficiency',
  authorizePermissions('PRODUCTION_DASHBOARD_VIEW'),
  getLineEfficiency
);

router.get(
  '/workers-productivity',
  authorizePermissions('PRODUCTION_DASHBOARD_VIEW'),
  getWorkerProductivity
);

router.get(
  '/snapshots',
  authorizePermissions('PRODUCTION_PROGRESS_VIEW'),
  getLatestProgressSnapshots
);

router.get(
  '/snapshots/:id/history',
  authorizePermissions('PRODUCTION_PROGRESS_VIEW'),
  validate(getProgressHistorySchema),
  getProgressHistory
);

export default router;
