import axiosClient from '../api/axiosClient.js';

export const supplierService = {
  async list(params = {}) {
    const response = await axiosClient.get('/suppliers', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/suppliers/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/suppliers', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/suppliers/${id}`, payload);
    return response;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/suppliers/${id}/deactivate`);
    return response;
  },
};
