import axiosClient from '../api/axiosClient.js';

export const operationService = {
  async list(params = {}) {
    const response = await axiosClient.get('/operations', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/operations/${id}`);
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/operations', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/operations/${id}`, payload);
    return response.data;
  },

  // Product Operations flow
  async getProductOperations(productId) {
    const response = await axiosClient.get(`/operations/products/${productId}/operations`);
    return response.data;
  },

  async addProductOperation(productId, payload) {
    const response = await axiosClient.post(`/operations/products/${productId}/operations`, payload);
    return response.data;
  },

  async updateProductOperation(productId, productOpId, payload) {
    const response = await axiosClient.put(`/operations/products/${productId}/operations/${productOpId}`, payload);
    return response.data;
  },

  async removeProductOperation(productId, productOpId) {
    const response = await axiosClient.delete(`/operations/products/${productId}/operations/${productOpId}`);
    return response.data;
  },
};
