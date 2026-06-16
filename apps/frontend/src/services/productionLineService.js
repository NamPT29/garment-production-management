import axiosClient from '../api/axiosClient.js';

export const productionLineService = {
  async list(params = {}) {
    const response = await axiosClient.get('/production-lines', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/production-lines/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/production-lines', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/production-lines/${id}`, payload);
    return response;
  },

  async getActiveEmployees(id) {
    const response = await axiosClient.get(`/production-lines/${id}/employees`);
    return response;
  },
};
