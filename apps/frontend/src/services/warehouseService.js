import axiosClient from '../api/axiosClient.js';

export const warehouseService = {
  async list(params = {}) {
    const response = await axiosClient.get('/warehouses', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/warehouses/${id}`);
    return response;
  },

  async getBalances(id, params = {}) {
    const response = await axiosClient.get(`/warehouses/${id}/balances`, { params });
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/warehouses', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/warehouses/${id}`, payload);
    return response;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/warehouses/${id}/deactivate`);
    return response;
  },
};
