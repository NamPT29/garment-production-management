import axiosClient from '../api/axiosClient.js';

export const materialRequirementService = {
  async getRequirementsByOrderId(orderId) {
    const response = await axiosClient.get(`/orders/${orderId}/material-requirements`);
    return response;
  },
};
