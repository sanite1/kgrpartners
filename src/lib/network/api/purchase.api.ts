import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  PurchaseOrder,
  PurchaseCounts,
  CreatePurchasePayload,
  UpdatePurchasePayload,
  SetPurchaseStatusPayload,
  PurchasesQueryParams,
} from "../types/purchase.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/purchases";

// the list response carries the board counts alongside the page
export type PurchasesResponse = PaginatedResponse<PurchaseOrder> & {
  counts?: PurchaseCounts;
};

// RAW API FUNCTIONS

export const getPurchasesFn = (
  params?: PurchasesQueryParams,
): Promise<PurchasesResponse> => api.get<PurchasesResponse>(BASE, params);

export const createPurchaseFn = (
  payload: CreatePurchasePayload,
): Promise<ApiResponse<PurchaseOrder>> =>
  api.post<ApiResponse<PurchaseOrder>>(BASE, payload);

export const updatePurchaseFn = (
  id: string,
  payload: UpdatePurchasePayload,
): Promise<ApiResponse<PurchaseOrder>> =>
  api.patch<ApiResponse<PurchaseOrder>>(`${BASE}/${id}`, payload);

export const setPurchaseStatusFn = (
  id: string,
  payload: SetPurchaseStatusPayload,
): Promise<ApiResponse<PurchaseOrder>> =>
  api.post<ApiResponse<PurchaseOrder>>(`${BASE}/${id}/status`, payload);

// REACT QUERY: Query Keys

export const purchaseKeys = {
  all: ["purchases"] as const,
  list: (params?: PurchasesQueryParams) =>
    [...purchaseKeys.all, "list", params ?? {}] as const,
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

export const useGetPurchases = (
  params?: PurchasesQueryParams,
  options?: Partial<UseQueryOptions<PurchasesResponse, AxiosError>>,
) =>
  useQuery<PurchasesResponse, AxiosError>({
    queryKey: purchaseKeys.list(params),
    queryFn: () => getPurchasesFn(params),
    ...options,
  });

// REACT QUERY: Mutations

const usePurchaseMutation = <TVars>(
  fn: (vars: TVars) => Promise<ApiResponse<PurchaseOrder>>,
) => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<PurchaseOrder>, AxiosError, TVars>({
    mutationFn: fn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: purchaseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreatePurchase = () =>
  usePurchaseMutation<CreatePurchasePayload>((payload) =>
    createPurchaseFn(payload),
  );

export const useUpdatePurchase = () =>
  usePurchaseMutation<{ id: string; payload: UpdatePurchasePayload }>(
    ({ id, payload }) => updatePurchaseFn(id, payload),
  );

export const useSetPurchaseStatus = () =>
  usePurchaseMutation<{ id: string; payload: SetPurchaseStatusPayload }>(
    ({ id, payload }) => setPurchaseStatusFn(id, payload),
  );
