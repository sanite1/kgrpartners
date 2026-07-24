import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  PartRequest,
  CreatePartRequestPayload,
  DecideRequestPayload,
  PartRequestsQueryParams,
  BusExpenseData,
} from "../types/partRequest.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/requests";

// RAW API FUNCTIONS

// POST /api/requests. 409 when a next-request-date lock exists
// (resend with allowOverride after the user confirms).
export const createPartRequestFn = (
  payload: CreatePartRequestPayload,
): Promise<ApiResponse<PartRequest>> =>
  api.post<ApiResponse<PartRequest>>(BASE, payload);

export const getPartRequestsFn = (
  params?: PartRequestsQueryParams,
): Promise<PaginatedResponse<PartRequest>> =>
  api.get<PaginatedResponse<PartRequest>>(BASE, params);

export const approvePartRequestFn = (
  id: string,
  payload: DecideRequestPayload,
): Promise<ApiResponse<PartRequest>> =>
  api.post<ApiResponse<PartRequest>>(`${BASE}/${id}/approve`, payload);

export const declinePartRequestFn = (
  id: string,
  payload: DecideRequestPayload,
): Promise<ApiResponse<PartRequest>> =>
  api.post<ApiResponse<PartRequest>>(`${BASE}/${id}/decline`, payload);

export const getBusExpenseFn = (params?: {
  from?: string;
  to?: string;
}): Promise<ApiResponse<BusExpenseData>> =>
  api.get<ApiResponse<BusExpenseData>>(`${BASE}/bus-expense`, params);

// REACT QUERY: Query Keys

export const partRequestKeys = {
  all: ["partRequests"] as const,
  list: (params?: PartRequestsQueryParams) =>
    [...partRequestKeys.all, "list", params ?? {}] as const,
  busExpense: (params?: { from?: string; to?: string }) =>
    [...partRequestKeys.all, "busExpense", params ?? {}] as const,
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

export const useGetPartRequests = (
  params?: PartRequestsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<PartRequest>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<PartRequest>, AxiosError>({
    queryKey: partRequestKeys.list(params),
    queryFn: () => getPartRequestsFn(params),
    ...options,
  });

export const useGetBusExpense = (
  params?: { from?: string; to?: string },
  options?: Partial<UseQueryOptions<ApiResponse<BusExpenseData>, AxiosError>>,
) =>
  useQuery<ApiResponse<BusExpenseData>, AxiosError>({
    queryKey: partRequestKeys.busExpense(params),
    queryFn: () => getBusExpenseFn(params),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreatePartRequest = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PartRequest>,
    AxiosError<ApiErrorResponse>,
    CreatePartRequestPayload
  >({
    mutationFn: (payload) => createPartRequestFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: partRequestKeys.all });
    },
    onError: (error) => {
      // 409 lock is confirmed inline by the form
      if (error.response?.status === 409) return;
      toast.error(getErrorMessage(error));
    },
  });
};

export const useApprovePartRequest = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PartRequest>,
    AxiosError,
    { id: string; payload: DecideRequestPayload }
  >({
    mutationFn: ({ id, payload }) => approvePartRequestFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: partRequestKeys.all });
      qc.invalidateQueries({ queryKey: ["inventory"] }); // stock changed
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeclinePartRequest = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PartRequest>,
    AxiosError,
    { id: string; payload: DecideRequestPayload }
  >({
    mutationFn: ({ id, payload }) => declinePartRequestFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: partRequestKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
