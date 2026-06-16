import { healthRepository } from './health.repository.js';

export const healthService = {
  async getHealth() {
    let database = 'unknown';

    try {
      database = await healthRepository.databaseStatus();
    } catch {
      database = 'unavailable';
    }

    return {
      service: 'backend',
      status: 'ok',
      database,
      stack: 'JavaScript ES Module + Express + mysql2/promise + MySQL',
      timestamp: new Date().toISOString(),
    };
  },
};
