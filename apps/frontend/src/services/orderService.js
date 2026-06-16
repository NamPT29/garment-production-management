import axiosClient from '../api/axiosClient.js';

export const orderService = {
  async list(params = {}) {
    const response = await axiosClient.get('/orders', { params });
    return response;
  },

  async summary() {
    const response = await axiosClient.get('/orders/summary');
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/orders/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/orders', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/orders/${id}`, payload);
    return response;
  },

  async updateStatus(id, payload) {
    const response = await axiosClient.patch(`/orders/${id}/status`, payload);
    return response;
  },

  async statusHistory(id) {
    const response = await axiosClient.get(`/orders/${id}/status-history`);
    return response;
  },
};
