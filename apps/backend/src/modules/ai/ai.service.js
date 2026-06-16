import { aiClient } from './ai.client.js';

export const aiService = {
  async getHealth() {
    return aiClient.getHealth();
  },
};
