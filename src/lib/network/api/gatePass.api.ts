import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  GatePass,
  CreateGatePassPayload,
  DecideGatePassPayload,
  GatePassesQueryParams,
} from "../types/gatePass.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/gate-passes";

// RAW API FUNCTIONS

export const getGatePassesFn = (
  params?: GatePassesQueryParams,
): Promise<PaginatedResponse<GatePass>> =>
  api.get<PaginatedResponse<GatePass>>(BASE, params);

export const createGatePassFn = (
  payload: CreateGatePassPayload,
): Promise<ApiResponse<GatePass>> =>
  api.post<ApiResponse<GatePass>>(BASE, payload);

export const approveGatePassFn = (
  id: string,
  payload: DecideGatePassPayload,
): Promise<ApiResponse<GatePass>> =>
  api.post<ApiResponse<GatePass>>(`${BASE}/${id}/approve`, payload);

export const declineGatePassFn = (
  id: string,
  payload: DecideGatePassPayload,
): Promise<ApiResponse<GatePass>> =>
  api.post<ApiResponse<GatePass>>(`${BASE}/${id}/decline`, payload);

export const carryOutGatePassFn = (
  id: string,
): Promise<ApiResponse<GatePass>> =>
  api.post<ApiResponse<GatePass>>(`${BASE}/${id}/carry-out`, {});

// REACT QUERY: Query Keys

export const gatePassKeys = {
  all: ["gate-passes"] as const,
  list: (params?: GatePassesQueryParams) =>
    [...gatePassKeys.all, "list", params ?? {}] as const,
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

export const useGetGatePasses = (
  params?: GatePassesQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<GatePass>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<GatePass>, AxiosError>({
    queryKey: gatePassKeys.list(params),
    queryFn: () => getGatePassesFn(params),
    ...options,
  });

// REACT QUERY: Mutations

const useGatePassMutation = <TVars>(
  fn: (vars: TVars) => Promise<ApiResponse<GatePass>>,
) => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<GatePass>, AxiosError, TVars>({
    mutationFn: fn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: gatePassKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreateGatePass = () =>
  useGatePassMutation<CreateGatePassPayload>((payload) =>
    createGatePassFn(payload),
  );

export const useApproveGatePass = () =>
  useGatePassMutation<{ id: string; payload: DecideGatePassPayload }>(
    ({ id, payload }) => approveGatePassFn(id, payload),
  );

export const useDeclineGatePass = () =>
  useGatePassMutation<{ id: string; payload: DecideGatePassPayload }>(
    ({ id, payload }) => declineGatePassFn(id, payload),
  );

export const useCarryOutGatePass = () =>
  useGatePassMutation<string>((id) => carryOutGatePassFn(id));
