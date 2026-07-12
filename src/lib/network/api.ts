import { axios } from "./axios";

export const api = {
  get: <T>(url: string, params?: object) =>
    axios.get<T>(url, { params }).then((res) => res.data),
  post: <T>(url: string, data?: unknown) =>
    axios.post<T>(url, data).then((res) => res.data),
  put: <T>(url: string, data?: unknown) =>
    axios.put<T>(url, data).then((res) => res.data),
  patch: <T>(url: string, data?: unknown) =>
    axios.patch<T>(url, data).then((res) => res.data),
  delete: <T>(url: string) => axios.delete<T>(url).then((res) => res.data),
};
