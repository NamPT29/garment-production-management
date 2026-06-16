import { ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { aiService } from './ai.service.js';

export const getAiHealth = asyncHandler(async (_req, res) => {
  const data = await aiService.getHealth();
  return ok(res, data, 'Ket noi AI Service thanh cong');
});
