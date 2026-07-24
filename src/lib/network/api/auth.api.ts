import { api } from "../api";
import type { ApiResponse, ApiErrorResponse } from "../types/api.types";
import type {
  LoginPayload,
  LoginData,
  ChangePasswordPayload,
  AuthUser,
} from "../types/auth.types";
import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/auth";

// RAW API FUNCTIONS

// POST /api/auth/login. Service returns ApiResponse(200, "Login successful",
// { user, accessToken, refreshToken }). Rate limited 10/15min/IP.
export const loginFn = (
  payload: LoginPayload,
): Promise<ApiResponse<LoginData>> =>
  api.post<ApiResponse<LoginData>>(`${BASE}/login`, payload);

// GET /api/auth/me. ApiResponse(200, "User retrieved successfully", user).
export const getMeFn = (): Promise<ApiResponse<AuthUser>> =>
  api.get<ApiResponse<AuthUser>>(`${BASE}/me`);

// POST /api/auth/change-password. ApiResponse(200, "Password changed successfully").
export const changePasswordFn = (
  payload: ChangePasswordPayload,
): Promise<ApiResponse<undefined>> =>
  api.post<ApiResponse<undefined>>(`${BASE}/change-password`, payload);

// REACT QUERY: Query Keys

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
} as const;

// Error helper

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    // field-level detail beats the generic headline message
    if (data?.fields?.length) {
      const first = data.fields[0].message;
      const extra = data.fields.length - 1;
      return extra > 0 ? `${first} (+${extra} more)` : first;
    }
    return data?.message || error.message;
  }
  return "An unexpected error occurred";
};

// REACT QUERY: Queries

export const useGetMe = (
  options?: Partial<UseQueryOptions<ApiResponse<AuthUser>, AxiosError>>,
) =>
  useQuery<ApiResponse<AuthUser>, AxiosError>({
    queryKey: authKeys.me(),
    queryFn: () => getMeFn(),
    ...options,
  });

// REACT QUERY: Mutations

export const useLogin = () =>
  useMutation<
    ApiResponse<LoginData>,
    AxiosError<ApiErrorResponse>,
    LoginPayload
  >({
    mutationFn: (payload) => loginFn(payload),
    onError: (error) => {
      // 400 field errors are mapped onto inputs by the form itself
      const data = error.response?.data;
      if (error.response?.status === 400 && data?.fields?.length) return;
      toast.error(getErrorMessage(error));
    },
  });

export const useChangePassword = () =>
  useMutation<
    ApiResponse<undefined>,
    AxiosError<ApiErrorResponse>,
    ChangePasswordPayload
  >({
    mutationFn: (payload) => changePasswordFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
