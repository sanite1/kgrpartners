import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

// localStorage keys shared with the axios interceptor (scaffolding brief)
const TOKEN_KEY = "app_token";
const USER_KEY = "app_user";
const REFRESH_KEY = "app_refresh_token";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean; // true until hydrate() has read localStorage
  hydrate: () => void;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  hydrate: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(USER_KEY);
      const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
      set({ user: token ? user : null, token, isLoading: false });
    } catch {
      set({ user: null, token: null, isLoading: false });
    }
  },

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ user: null, token: null, isLoading: false });
  },
}));
