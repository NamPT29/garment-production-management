import axiosClient from '../api/axiosClient.js';

export const operationService = {
  async list(params = {}) {
    const response = await axiosClient.get('/operations', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/operations/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/operations', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/operations/${id}`, payload);
    return response;
  },

  // Product Operations flow
  async getProductOperations(productId) {
    const response = await axiosClient.get(`/operations/products/${productId}/operations`);
    return response;
  },

  async addProductOperation(productId, payload) {
    const response = await axiosClient.post(`/operations/products/${productId}/operations`, payload);
    return response;
  },

  async updateProductOperation(productId, productOpId, payload) {
    const response = await axiosClient.put(`/operations/products/${productId}/operations/${productOpId}`, payload);
    return response;
  },

  async removeProductOperation(productId, productOpId) {
    const response = await axiosClient.delete(`/operations/products/${productId}/operations/${productOpId}`);
    return response;
  },
};
