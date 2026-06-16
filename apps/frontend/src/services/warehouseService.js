import axiosClient from '../api/axiosClient.js';

export const warehouseService = {
  async list(params = {}) {
    const response = await axiosClient.get('/warehouses', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/warehouses/${id}`);
    return response.data;
  },

  async getBalances(id, params = {}) {
    const response = await axiosClient.get(`/warehouses/${id}/balances`, { params });
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/warehouses', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/warehouses/${id}`, payload);
    return response.data;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/warehouses/${id}/deactivate`);
    return response.data;
  },
};
