import axiosClient from '../api/axiosClient.js';

export const productionOrderService = {
  async list(params = {}) {
    const response = await axiosClient.get('/production-orders', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/production-orders/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/production-orders', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/production-orders/${id}`, payload);
    return response;
  },

  async updateStatus(id, status) {
    const response = await axiosClient.patch(`/production-orders/${id}/status`, { status });
    return response;
  },
};
