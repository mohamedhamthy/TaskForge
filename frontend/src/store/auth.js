import { create } from "zustand";

import { api } from "../services/api";

const TOKEN_KEY = "taskforge_token";

export const useAuthStore = create((set) => ({
  user: null,
  loading: !!localStorage.getItem(TOKEN_KEY),
  error: null,
  clearError: () => set({ error: null }),

  initialize: async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      set({ loading: false });
      return;
    }

    try {
      const { data } = await api.me();
      set({ user: data.user, loading: false, error: null });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, loading: false });
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null });

    try {
      const { data } = await api.login(credentials);
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  createAccount: async (userData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await api.register(userData);
      set({ loading: false });
      return data;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });

    try {
      const { data } = await api.register(userData);
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    const { data } = await api.changePassword(passwordData);
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data.user, error: null });
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, error: null });
    }
  },
}));
