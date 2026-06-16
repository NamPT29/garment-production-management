import axiosClient from '../api/axiosClient.js';

export const productionScheduleService = {
  // Allocations
  async listAllocations(params = {}) {
    const response = await axiosClient.get('/production-plans/allocations', { params });
    return response.data;
  },

  async getAllocationById(id) {
    const response = await axiosClient.get(`/production-plans/allocations/${id}`);
    return response.data;
  },

  async createAllocation(payload) {
    const response = await axiosClient.post('/production-plans/allocations', payload);
    return response.data;
  },

  async updateAllocation(id, payload) {
    const response = await axiosClient.put(`/production-plans/allocations/${id}`, payload);
    return response.data;
  },

  // Schedules
  async listSchedules(params = {}) {
    const response = await axiosClient.get('/production-plans/schedules', { params });
    return response.data;
  },

  async getScheduleById(id) {
    const response = await axiosClient.get(`/production-plans/schedules/${id}`);
    return response.data;
  },

  async createSchedule(payload) {
    const response = await axiosClient.post('/production-plans/schedules', payload);
    return response.data;
  },

  async updateSchedule(id, payload) {
    const response = await axiosClient.put(`/production-plans/schedules/${id}`, payload);
    return response.data;
  },

  // Assignments
  async getScheduleAssignments(scheduleId) {
    const response = await axiosClient.get(`/production-plans/schedules/${scheduleId}/assignments`);
    return response.data;
  },

  async assignEmployeeToSchedule(scheduleId, payload) {
    const response = await axiosClient.post(`/production-plans/schedules/${scheduleId}/assignments`, payload);
    return response.data;
  },

  async removeEmployeeFromSchedule(scheduleId, assignmentId) {
    const response = await axiosClient.delete(`/production-plans/schedules/${scheduleId}/assignments/${assignmentId}`);
    return response.data;
  },
};
