import axiosClient from '../api/axiosClient.js';

export const bomService = {
  async list(params = {}) {
    const response = await axiosClient.get('/boms', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/boms/${id}`);
    return response.data;
  },

  async getProductBoms(productId) {
    const response = await axiosClient.get(`/products/${productId}/boms`);
    return response.data;
  },

  async getProductActiveBom(productId) {
    const response = await axiosClient.get(`/products/${productId}/active-bom`);
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/boms', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/boms/${id}`, payload);
    return response.data;
  },

  async activate(id) {
    const response = await axiosClient.patch(`/boms/${id}/activate`);
    return response.data;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/boms/${id}/deactivate`);
    return response.data;
  },
};
