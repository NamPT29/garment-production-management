import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('../../src/modules/health/health.repository.js', () => ({
  healthRepository: {
    databaseStatus: jest.fn().mockResolvedValue('ok'),
  },
}));

const { healthService } = await import('../../src/modules/health/health.service.js');

describe('healthService', () => {
  it('returns health payload', async () => {
    const result = await healthService.getHealth();

    expect(result.service).toBe('backend');
    expect(result.status).toBe('ok');
    expect(result.database).toBe('ok');
  });
});
