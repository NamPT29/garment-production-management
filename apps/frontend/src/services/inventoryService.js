import axiosClient from '../api/axiosClient.js';

export const inventoryService = {
  async listBalances(params = {}) {
    const response = await axiosClient.get('/inventory/balances', { params });
    return response;
  },

  async listTransactions(params = {}) {
    const response = await axiosClient.get('/inventory/transactions', { params });
    return response;
  },

  async getTransactionById(id) {
    const response = await axiosClient.get(`/inventory/transactions/${id}`);
    return response;
  },

  async createReceipt(payload) {
    const response = await axiosClient.post('/inventory/receipts', payload);
    return response;
  },

  async createIssue(payload) {
    const response = await axiosClient.post('/inventory/issues', payload);
    return response;
  },

  async createAdjustment(payload) {
    const response = await axiosClient.post('/inventory/adjustments', payload);
    return response;
  },

  async getDashboardSummary() {
    const response = await axiosClient.get('/inventory/dashboard-summary');
    return response;
  },
};
