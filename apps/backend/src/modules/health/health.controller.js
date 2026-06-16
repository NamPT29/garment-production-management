import { ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { healthService } from './health.service.js';

export const getHealth = asyncHandler(async (_req, res) => {
  const data = await healthService.getHealth();
  return ok(res, data, 'Backend dang hoat dong');
});
