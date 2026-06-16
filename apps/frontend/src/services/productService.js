import axiosClient from '../api/axiosClient.js';

export const productService = {
  async list(params = {}) {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/products', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/products/${id}`, payload);
    return response.data;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/products/${id}/deactivate`);
    return response.data;
  },
};
