import axiosClient from '../api/axiosClient.js';

export const productionOutputService = {
  async list(params = {}) {
    const response = await axiosClient.get('/production-outputs', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/production-outputs/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/production-outputs', payload);
    return response;
  },
};
