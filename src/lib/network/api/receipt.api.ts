import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Receipt,
  CreateReceiptPayload,
  ReceiptsQueryParams,
  VoidReceiptPayload,
  ReceiptSummary,
} from "../types/receipt.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/receipts";

// RAW API FUNCTIONS

// POST /api/receipts. 201 "Receipt issued successfully".
// 409 when the bus already has a receipt today (resend with allowDuplicate).
export const createReceiptFn = (
  payload: CreateReceiptPayload,
): Promise<ApiResponse<Receipt>> =>
  api.post<ApiResponse<Receipt>>(BASE, payload);

// GET /api/receipts: paginated, filterable.
export const getReceiptsFn = (
  params?: ReceiptsQueryParams,
): Promise<PaginatedResponse<Receipt>> =>
  api.get<PaginatedResponse<Receipt>>(BASE, params);

// GET /api/receipts/:id
export const getReceiptFn = (id: string): Promise<ApiResponse<Receipt>> =>
  api.get<ApiResponse<Receipt>>(`${BASE}/${id}`);

// POST /api/receipts/:id/check-in
export const checkInReceiptFn = (id: string): Promise<ApiResponse<Receipt>> =>
  api.post<ApiResponse<Receipt>>(`${BASE}/${id}/check-in`);

// POST /api/receipts/:id/void (admin, reason required)
export const voidReceiptFn = (
  id: string,
  payload: VoidReceiptPayload,
): Promise<ApiResponse<Receipt>> =>
  api.post<ApiResponse<Receipt>>(`${BASE}/${id}/void`, payload);

// GET /api/receipts/summary?date=YYYY-MM-DD
export const getReceiptSummaryFn = (
  date?: string,
): Promise<ApiResponse<ReceiptSummary>> =>
  api.get<ApiResponse<ReceiptSummary>>(
    `${BASE}/summary`,
    date ? { date } : undefined,
  );

// REACT QUERY: Query Keys

export const receiptKeys = {
  all: ["receipts"] as const,
  list: (params?: ReceiptsQueryParams) =>
    [...receiptKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...receiptKeys.all, "detail", id] as const,
  summary: (date?: string) =>
    [...receiptKeys.all, "summary", date ?? "today"] as const,
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

export const useGetReceipts = (
  params?: ReceiptsQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<Receipt>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<Receipt>, AxiosError>({
    queryKey: receiptKeys.list(params),
    queryFn: () => getReceiptsFn(params),
    ...options,
  });

export const useGetReceiptSummary = (
  date?: string,
  options?: Partial<UseQueryOptions<ApiResponse<ReceiptSummary>, AxiosError>>,
) =>
  useQuery<ApiResponse<ReceiptSummary>, AxiosError>({
    queryKey: receiptKeys.summary(date),
    queryFn: () => getReceiptSummaryFn(date),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateReceipt = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Receipt>,
    AxiosError<ApiErrorResponse>,
    CreateReceiptPayload
  >({
    mutationFn: (payload) => createReceiptFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: receiptKeys.all });
    },
    onError: (error) => {
      // 409 duplicate is handled by the form (confirm and resend)
      if (error.response?.status === 409) return;
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCheckInReceipt = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Receipt>, AxiosError, string>({
    mutationFn: (id) => checkInReceiptFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: receiptKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useVoidReceipt = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Receipt>,
    AxiosError,
    { id: string; payload: VoidReceiptPayload }
  >({
    mutationFn: ({ id, payload }) => voidReceiptFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: receiptKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
