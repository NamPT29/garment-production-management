import { query } from '../../config/database.js';

export const healthRepository = {
  async databaseStatus() {
    await query('SELECT 1 AS ok');
    return 'ok';
  },
};
