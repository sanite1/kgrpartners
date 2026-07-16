import Axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "./stores/auth.store";
import { getModule } from "./helpers/getModule";

const API_URL = import.meta.env.VITE_API_URL;

export const axios: AxiosInstance = Axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Request interceptor: attach the JWT from localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("app_token");
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: silent refresh on 401 (mutex-queued).
// NO envelope unwrapping here.
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(error),
  );
  failedQueue = [];
};
const forceLogout = () => {
  localStorage.removeItem("app_token");
  localStorage.removeItem("app_user");
  localStorage.removeItem("app_refresh_token");
  if (getModule() === "admin") {
    // only the admin module has /login; platform never navigates away
    const currentPath = window.location.pathname + window.location.search;
    window.location.href =
      currentPath && currentPath !== "/login"
        ? `/login?redirect=${encodeURIComponent(currentPath)}`
        : "/login";
  }
};

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === "/api/auth/refresh"
    ) {
      if (
        error.response?.status === 401 &&
        originalRequest.url === "/api/auth/refresh"
      )
        forceLogout();
      return Promise.reject(error);
    }
    const refreshToken = localStorage.getItem("app_refresh_token");
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) =>
        failedQueue.push({ resolve, reject }),
      ).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      // raw Axios: skip interceptors
      const res = await Axios.post(
        `${API_URL}/api/auth/refresh`,
        { token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
      const newAccessToken: string = res.data?.data?.accessToken;
      if (!newAccessToken)
        throw new Error("No accessToken in refresh response");
      localStorage.setItem("app_token", newAccessToken);
      const state = useAuthStore.getState();
      if (state.user) state.setAuth(state.user, newAccessToken);
      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
