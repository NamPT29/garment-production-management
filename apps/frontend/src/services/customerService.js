import axiosClient from '../api/axiosClient.js';

export const customerService = {
  async list(params = {}) {
    const response = await axiosClient.get('/customers', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/customers/${id}`);
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/customers', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/customers/${id}`, payload);
    return response.data;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/customers/${id}/deactivate`);
    return response.data;
  },
};
