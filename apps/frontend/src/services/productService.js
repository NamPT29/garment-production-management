import axiosClient from '../api/axiosClient.js';

export const productService = {
  async list(params = {}) {
    const response = await axiosClient.get('/products', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/products/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/products', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/products/${id}`, payload);
    return response;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/products/${id}/deactivate`);
    return response;
  },
};
