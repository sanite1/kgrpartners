import Axios, { type AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// This site is fully public (no auth), so the instance carries no
// Authorization header and no 401-refresh interceptor.
export const axios: AxiosInstance = Axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
