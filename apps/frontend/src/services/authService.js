import axiosClient from '../api/axiosClient.js';

export const authService = {
  async login({ identifier, password }) {
    const response = await axiosClient.post('/auth/login', { identifier, password });

    if (response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  async getCurrentUser() {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  async changePassword(payload) {
    const response = await axiosClient.patch('/auth/change-password', payload);
    return response.data;
  },

  logoutLocal() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
  },
};
