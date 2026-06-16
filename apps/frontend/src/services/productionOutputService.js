import axiosClient from '../api/axiosClient.js';

export const productionOutputService = {
  async list(params = {}) {
    const response = await axiosClient.get('/production-outputs', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/production-outputs/${id}`);
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/production-outputs', payload);
    return response.data;
  },
};
