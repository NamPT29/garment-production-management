import { Router } from 'express';
import { getAiHealth } from './ai.controller.js';

const router = Router();

router.get('/health', getAiHealth);

export default router;
