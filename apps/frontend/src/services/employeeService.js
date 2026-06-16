import axiosClient from '../api/axiosClient.js';

export const employeeService = {
  async list(params = {}) {
    const response = await axiosClient.get('/employees', { params });
    return response.data;
  },

  async getById(id) {
    const response = await axiosClient.get(`/employees/${id}`);
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post('/employees', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/employees/${id}`, payload);
    return response.data;
  },

  async assignLine(id, payload) {
    const response = await axiosClient.post(`/employees/${id}/assign-line`, payload);
    return response.data;
  },

  async getAssignments(id) {
    const response = await axiosClient.get(`/employees/${id}/assignments`);
    return response.data;
  },

  async endAssignment(id, assignmentId, payload = {}) {
    const response = await axiosClient.put(`/employees/${id}/assignments/${assignmentId}/end`, payload);
    return response.data;
  },
};
