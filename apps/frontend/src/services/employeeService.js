import axiosClient from '../api/axiosClient.js';

export const employeeService = {
  async list(params = {}) {
    const response = await axiosClient.get('/employees', { params });
    return response;
  },

  async getById(id) {
    const response = await axiosClient.get(`/employees/${id}`);
    return response;
  },

  async create(payload) {
    const response = await axiosClient.post('/employees', payload);
    return response;
  },

  async update(id, payload) {
    const response = await axiosClient.put(`/employees/${id}`, payload);
    return response;
  },

  async assignLine(id, payload) {
    const response = await axiosClient.post(`/employees/${id}/assign-line`, payload);
    return response;
  },

  async getAssignments(id) {
    const response = await axiosClient.get(`/employees/${id}/assignments`);
    return response;
  },

  async endAssignment(id, assignmentId, payload = {}) {
    const response = await axiosClient.put(`/employees/${id}/assignments/${assignmentId}/end`, payload);
    return response;
  },
};
