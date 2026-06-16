import axios from 'axios';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const aiHttpClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 5000,
});

export const aiClient = {
  async getHealth() {
    try {
      const response = await aiHttpClient.get('/health');

      if (!response.data || response.data.success !== true) {
        throw new AppError('AI Service tra ve du lieu khong hop le', 502, 'AI_INVALID_RESPONSE');
      }

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === 'ECONNABORTED') {
        throw new AppError('AI Service timeout', 504, 'AI_TIMEOUT');
      }

      throw new AppError('Khong the ket noi AI Service', 503, 'AI_SERVICE_UNAVAILABLE');
    }
  },
};
