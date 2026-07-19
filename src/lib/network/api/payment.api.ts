import { api } from "../api";
import { axios } from "../axios"; // blob download only; JSON goes through `api`
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Payment,
  PayReceiptPayload,
  PayReceiptData,
  PaymentsQueryParams,
  DailyAccountData,
  ExportPaymentsParams,
} from "../types/payment.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/payments";

// RAW API FUNCTIONS

// POST /api/payments. 201 "Receipt #<bill> marked paid", { payment, receipt }.
export const payReceiptFn = (
  payload: PayReceiptPayload,
): Promise<ApiResponse<PayReceiptData>> =>
  api.post<ApiResponse<PayReceiptData>>(BASE, payload);

// GET /api/payments: paginated collections, filterable by day and cashier.
export const getPaymentsFn = (
  params?: PaymentsQueryParams,
): Promise<PaginatedResponse<Payment>> =>
  api.get<PaginatedResponse<Payment>>(BASE, params);

// GET /api/payments/daily-account?date=YYYY-MM-DD&page=N
export const getDailyAccountFn = (
  date?: string,
  page?: number,
): Promise<ApiResponse<DailyAccountData>> =>
  api.get<ApiResponse<DailyAccountData>>(`${BASE}/daily-account`, {
    ...(date ? { date } : {}),
    ...(page ? { page } : {}),
  });

// GET /api/payments/export: CSV blob (shift report / daily export)
export const downloadPaymentsCsvFn = async (
  params?: ExportPaymentsParams,
): Promise<Blob> => {
  const res = await axios.get(`${BASE}/export`, {
    params,
    responseType: "blob",
  });
  return res.data as Blob;
};

// REACT QUERY: Query Keys

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params?: PaymentsQueryParams) =>
    [...paymentKeys.all, "list", params ?? {}] as const,
  dailyAccount: (date?: string, page?: number) =>
    [...paymentKeys.all, "dailyAccount", date ?? "today", page ?? 1] as const,
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

export const useGetPayments = (
  params?: PaymentsQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<Payment>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<Payment>, AxiosError>({
    queryKey: paymentKeys.list(params),
    queryFn: () => getPaymentsFn(params),
    ...options,
  });

export const useGetDailyAccount = (
  date?: string,
  page?: number,
  options?: Partial<UseQueryOptions<ApiResponse<DailyAccountData>, AxiosError>>,
) =>
  useQuery<ApiResponse<DailyAccountData>, AxiosError>({
    queryKey: paymentKeys.dailyAccount(date, page),
    queryFn: () => getDailyAccountFn(date, page),
    ...options,
  });

// REACT QUERY: Mutations

export const usePayReceipt = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PayReceiptData>,
    AxiosError,
    PayReceiptPayload
  >({
    mutationFn: (payload) => payReceiptFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: ["receipts"] }); // cross-domain
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
