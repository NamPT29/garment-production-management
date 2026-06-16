import axiosClient from '../api/axiosClient.js';

export const customerService = {
  async list(params = {}) {
    const response = await axiosClient.get('/customers', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/customers/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/customers', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/customers/${id}`, payload);
    return response;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/customers/${id}/deactivate`);
    return response;
  },
};
