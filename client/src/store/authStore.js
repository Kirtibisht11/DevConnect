import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading: false,
  error: null,

  // Register
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      set({ user: res.data.user, accessToken: res.data.accessToken, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
      return { success: false };
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      set({ user: res.data.user, accessToken: res.data.accessToken, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
      return { success: false };
    }
  },

  // Get current user
  getMe: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isLoading: false });
    } catch (err) {
      set({ user: null, isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null });
    window.location.href = '/login';
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;