import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  ConsoleUser,
  CreateUserPayload,
  UpdateUserPayload,
  UsersQueryParams,
} from "../types/user.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/users";

// RAW API FUNCTIONS

export const getUsersFn = (
  params?: UsersQueryParams,
): Promise<PaginatedResponse<ConsoleUser>> =>
  api.get<PaginatedResponse<ConsoleUser>>(BASE, params);

export const createUserFn = (
  payload: CreateUserPayload,
): Promise<ApiResponse<ConsoleUser>> =>
  api.post<ApiResponse<ConsoleUser>>(BASE, payload);

export const updateUserFn = (
  id: string,
  payload: UpdateUserPayload,
): Promise<ApiResponse<ConsoleUser>> =>
  api.patch<ApiResponse<ConsoleUser>>(`${BASE}/${id}`, payload);

// REACT QUERY: Query Keys

export const userKeys = {
  all: ["users"] as const,
  list: (params?: UsersQueryParams) =>
    [...userKeys.all, "list", params ?? {}] as const,
} as const;

// Error helper

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message;
  }
  return "An unexpected error occurred";
};

// REACT QUERY: Queries

export const useGetUsers = (
  params?: UsersQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<ConsoleUser>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<ConsoleUser>, AxiosError>({
    queryKey: userKeys.list(params),
    queryFn: () => getUsersFn(params),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ConsoleUser>, AxiosError, CreateUserPayload>({
    mutationFn: (payload) => createUserFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ConsoleUser>,
    AxiosError,
    { id: string; payload: UpdateUserPayload }
  >({
    mutationFn: ({ id, payload }) => updateUserFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
