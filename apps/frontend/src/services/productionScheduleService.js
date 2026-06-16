import axiosClient from '../api/axiosClient.js';

export const productionScheduleService = {
  // Schedules
  async listSchedules(params = {}) {
    const response = await axiosClient.get('/production-plans/schedules', { params });
    return response;
  },

  async getScheduleById(id) {
    const response = await axiosClient.get(`/production-plans/schedules/${id}`);
    return response;
  },

  async createSchedule(payload) {
    const response = await axiosClient.post('/production-plans/schedules', payload);
    return response;
  },

  async updateSchedule(id, payload) {
    const response = await axiosClient.put(`/production-plans/schedules/${id}`, payload);
    return response;
  },
};
