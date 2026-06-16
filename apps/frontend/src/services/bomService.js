import axiosClient from '../api/axiosClient.js';

export const bomService = {
  async list(params = {}) {
    const response = await axiosClient.get('/boms', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/boms/${id}`);
    return response;
  },

  async getProductBoms(productId) {
    const response = await axiosClient.get(`/products/${productId}/boms`);
    return response;
  },

  async getProductActiveBom(productId) {
    const response = await axiosClient.get(`/products/${productId}/active-bom`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/boms', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/boms/${id}`, payload);
    return response;
  },

  async activate(id) {
    const response = await axiosClient.patch(`/boms/${id}/activate`);
    return response;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/boms/${id}/deactivate`);
    return response;
  },
};
