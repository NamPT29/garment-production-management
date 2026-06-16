import { Router } from 'express';
import { getHealth } from './health.controller.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Kiem tra trang thai backend
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Backend dang hoat dong
 */
router.get('/', getHealth);

export default router;
