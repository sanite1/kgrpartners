import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  FinanceEntry,
  FinanceOverviewData,
  FinanceMonthsData,
  FinanceSeriesData,
  CreateFinanceEntryPayload,
  BuyDownPayload,
  FinanceEntriesQueryParams,
} from "../types/finance.types";
import type { ReceiptSeriesRange } from "../types/receipt.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/finance";

// RAW API FUNCTIONS

export const getFinanceOverviewFn = (): Promise<
  ApiResponse<FinanceOverviewData>
> => api.get<ApiResponse<FinanceOverviewData>>(`${BASE}/overview`);

export const getFinanceMonthsFn = (
  limit?: number,
): Promise<ApiResponse<FinanceMonthsData>> =>
  api.get<ApiResponse<FinanceMonthsData>>(`${BASE}/months`, { limit });

export const getFinanceSeriesFn = (
  range: ReceiptSeriesRange,
): Promise<ApiResponse<FinanceSeriesData>> =>
  api.get<ApiResponse<FinanceSeriesData>>(`${BASE}/series`, { range });

export const getFinanceEntriesFn = (
  params?: FinanceEntriesQueryParams,
): Promise<PaginatedResponse<FinanceEntry>> =>
  api.get<PaginatedResponse<FinanceEntry>>(`${BASE}/entries`, params);

export const createFinanceEntryFn = (
  payload: CreateFinanceEntryPayload,
): Promise<ApiResponse<FinanceEntry>> =>
  api.post<ApiResponse<FinanceEntry>>(`${BASE}/entries`, payload);

export const buyDownFn = (
  payload: BuyDownPayload,
): Promise<ApiResponse<FinanceEntry>> =>
  api.post<ApiResponse<FinanceEntry>>(`${BASE}/buy-down`, payload);

export const deleteFinanceEntryFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/entries/${id}`);

// REACT QUERY: Query Keys

export const financeKeys = {
  all: ["finance"] as const,
  overview: () => [...financeKeys.all, "overview"] as const,
  months: (limit?: number) => [...financeKeys.all, "months", limit ?? 12] as const,
  series: (range: string) => [...financeKeys.all, "series", range] as const,
  entries: (params?: FinanceEntriesQueryParams) =>
    [...financeKeys.all, "entries", params ?? {}] as const,
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

export const useGetFinanceOverview = (
  options?: Partial<
    UseQueryOptions<ApiResponse<FinanceOverviewData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<FinanceOverviewData>, AxiosError>({
    queryKey: financeKeys.overview(),
    queryFn: () => getFinanceOverviewFn(),
    ...options,
  });

export const useGetFinanceMonths = (
  limit?: number,
  options?: Partial<UseQueryOptions<ApiResponse<FinanceMonthsData>, AxiosError>>,
) =>
  useQuery<ApiResponse<FinanceMonthsData>, AxiosError>({
    queryKey: financeKeys.months(limit),
    queryFn: () => getFinanceMonthsFn(limit),
    ...options,
  });

export const useGetFinanceSeries = (
  range: ReceiptSeriesRange,
  options?: Partial<UseQueryOptions<ApiResponse<FinanceSeriesData>, AxiosError>>,
) =>
  useQuery<ApiResponse<FinanceSeriesData>, AxiosError>({
    queryKey: financeKeys.series(range),
    queryFn: () => getFinanceSeriesFn(range),
    ...options,
  });

export const useGetFinanceEntries = (
  params?: FinanceEntriesQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<FinanceEntry>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<FinanceEntry>, AxiosError>({
    queryKey: financeKeys.entries(params),
    queryFn: () => getFinanceEntriesFn(params),
    ...options,
  });

// REACT QUERY: Mutations

const useInvalidatingMutation = <TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData & { message: string }>,
) => {
  const qc = useQueryClient();
  return useMutation<TData & { message: string }, AxiosError, TVars>({
    mutationFn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreateFinanceEntry = () =>
  useInvalidatingMutation<ApiResponse<FinanceEntry>, CreateFinanceEntryPayload>(
    createFinanceEntryFn,
  );

export const useBuyDown = () =>
  useInvalidatingMutation<ApiResponse<FinanceEntry>, BuyDownPayload>(buyDownFn);

export const useDeleteFinanceEntry = () =>
  useInvalidatingMutation<ApiResponse<undefined>, string>(deleteFinanceEntryFn);
