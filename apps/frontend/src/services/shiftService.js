import axiosClient from '../api/axiosClient.js';

export const shiftService = {
  async list(params = {}) {
    const response = await axiosClient.get('/shifts', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/shifts/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/shifts', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/shifts/${id}`, payload);
    return response;
  },
};
