import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  RepairJob,
  CreateRepairJobPayload,
  CompleteRepairJobPayload,
  CancelRepairJobPayload,
  RepairPartInput,
  RepairJobsQueryParams,
} from "../types/repair.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/repairs";

// RAW API FUNCTIONS

export const getRepairJobsFn = (
  params?: RepairJobsQueryParams,
): Promise<PaginatedResponse<RepairJob>> =>
  api.get<PaginatedResponse<RepairJob>>(BASE, params);

export const createRepairJobFn = (
  payload: CreateRepairJobPayload,
): Promise<ApiResponse<RepairJob>> =>
  api.post<ApiResponse<RepairJob>>(BASE, payload);

export const addRepairPartFn = (
  id: string,
  payload: RepairPartInput,
): Promise<ApiResponse<RepairJob>> =>
  api.post<ApiResponse<RepairJob>>(`${BASE}/${id}/parts`, payload);

export const completeRepairJobFn = (
  id: string,
  payload: CompleteRepairJobPayload,
): Promise<ApiResponse<RepairJob>> =>
  api.post<ApiResponse<RepairJob>>(`${BASE}/${id}/complete`, payload);

export const cancelRepairJobFn = (
  id: string,
  payload: CancelRepairJobPayload,
): Promise<ApiResponse<RepairJob>> =>
  api.post<ApiResponse<RepairJob>>(`${BASE}/${id}/cancel`, payload);

// REACT QUERY: Query Keys

export const repairKeys = {
  all: ["repairs"] as const,
  list: (params?: RepairJobsQueryParams) =>
    [...repairKeys.all, "list", params ?? {}] as const,
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

export const useGetRepairJobs = (
  params?: RepairJobsQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<RepairJob>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<RepairJob>, AxiosError>({
    queryKey: repairKeys.list(params),
    queryFn: () => getRepairJobsFn(params),
    ...options,
  });

// REACT QUERY: Mutations
// Opening a job consumes stock and can flip a battery to faulty,
// so repair mutations also invalidate inventory and batteries.

export const useCreateRepairJob = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<RepairJob>,
    AxiosError,
    CreateRepairJobPayload
  >({
    mutationFn: (payload) => createRepairJobFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: repairKeys.all });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["batteries"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAddRepairPart = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<RepairJob>,
    AxiosError,
    { id: string; payload: RepairPartInput }
  >({
    mutationFn: ({ id, payload }) => addRepairPartFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: repairKeys.all });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCompleteRepairJob = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<RepairJob>,
    AxiosError,
    { id: string; payload: CompleteRepairJobPayload }
  >({
    mutationFn: ({ id, payload }) => completeRepairJobFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: repairKeys.all });
      qc.invalidateQueries({ queryKey: ["batteries"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCancelRepairJob = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<RepairJob>,
    AxiosError,
    { id: string; payload: CancelRepairJobPayload }
  >({
    mutationFn: ({ id, payload }) => cancelRepairJobFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: repairKeys.all });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["batteries"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
