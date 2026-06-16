import axiosClient from '../api/axiosClient.js';

export const productionProgressService = {
  async getDashboardSummary() {
    const response = await axiosClient.get('/production-progress/dashboard');
    return response;
  },

  async getLineEfficiency() {
    const response = await axiosClient.get('/production-progress/lines-efficiency');
    return response;
  },

  async getWorkerProductivity() {
    const response = await axiosClient.get('/production-progress/workers-productivity');
    return response;
  },

  async getLatestProgressSnapshots() {
    const response = await axiosClient.get('/production-progress/snapshots');
    return response;
  },

  async getProgressHistory(orderId) {
    const response = await axiosClient.get(`/production-progress/snapshots/${orderId}/history`);
    return response;
  },
};
