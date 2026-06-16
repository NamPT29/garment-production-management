import axiosClient from '../api/axiosClient.js';

export const materialService = {
  async list(params = {}) {
    const response = await axiosClient.get('/materials', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/materials/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/materials', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.patch(`/materials/${id}`, payload);
    return response;
  },

  async deactivate(id) {
    const response = await axiosClient.patch(`/materials/${id}/deactivate`);
    return response;
  },
};
