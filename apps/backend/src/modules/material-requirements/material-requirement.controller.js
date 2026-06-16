import { ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { materialRequirementService } from './material-requirement.service.js';

export const getMaterialRequirements = asyncHandler(async (req, res) => {
  const requirements = await materialRequirementService.calculateRequirements(req.validated.params.id);
  return ok(res, requirements, 'Tinh nhu cau nguyen phu lieu thanh cong');
});
