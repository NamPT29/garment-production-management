import axiosClient from '../api/axiosClient.js';

export const productionProgressService = {
  async getDashboardSummary() {
    const response = await axiosClient.get('/production-progress/dashboard');
    return response.data;
  },

  async getLineEfficiency() {
    const response = await axiosClient.get('/production-progress/lines-efficiency');
    return response.data;
  },

  async getWorkerProductivity() {
    const response = await axiosClient.get('/production-progress/workers-productivity');
    return response.data;
  },

  async getLatestProgressSnapshots() {
    const response = await axiosClient.get('/production-progress/snapshots');
    return response.data;
  },

  async getProgressHistory(orderId) {
    const response = await axiosClient.get(`/production-progress/snapshots/${orderId}/history`);
    return response.data;
  },
};
