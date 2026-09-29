import { api } from "../api";
import type { ApiResponse, ApiErrorResponse } from "../types/api.types";
import type {
  MoneyBookEntry,
  MoneyBookCategory,
  MoneyBookAccount,
  MoneyBookOverviewData,
  MoneyBookEntriesData,
  MoneyBookReportsData,
  MoneyBookMetaData,
  CreateMoneyBookEntryPayload,
  UpdateMoneyBookEntryPayload,
  MoneyBookEntriesQueryParams,
  CreateMoneyBookCategoryPayload,
} from "../types/moneyBook.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/money-book";

// RAW API FUNCTIONS

export const getMoneyBookOverviewFn = (
  month?: string,
): Promise<ApiResponse<MoneyBookOverviewData>> =>
  api.get<ApiResponse<MoneyBookOverviewData>>(`${BASE}/overview`, { month });

export const getMoneyBookEntriesFn = (
  params?: MoneyBookEntriesQueryParams,
): Promise<ApiResponse<MoneyBookEntriesData>> =>
  api.get<ApiResponse<MoneyBookEntriesData>>(`${BASE}/entries`, params);

export const getMoneyBookReportsFn = (
  month?: string,
  months?: number,
): Promise<ApiResponse<MoneyBookReportsData>> =>
  api.get<ApiResponse<MoneyBookReportsData>>(`${BASE}/reports`, {
    month,
    months,
  });

export const getMoneyBookMetaFn = (): Promise<ApiResponse<MoneyBookMetaData>> =>
  api.get<ApiResponse<MoneyBookMetaData>>(`${BASE}/meta`);

export const createMoneyBookEntryFn = (
  payload: CreateMoneyBookEntryPayload,
): Promise<ApiResponse<MoneyBookEntry>> =>
  api.post<ApiResponse<MoneyBookEntry>>(`${BASE}/entries`, payload);

export const updateMoneyBookEntryFn = (
  id: string,
  payload: UpdateMoneyBookEntryPayload,
): Promise<ApiResponse<MoneyBookEntry>> =>
  api.patch<ApiResponse<MoneyBookEntry>>(`${BASE}/entries/${id}`, payload);

export const deleteMoneyBookEntryFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/entries/${id}`);

export const createMoneyBookCategoryFn = (
  payload: CreateMoneyBookCategoryPayload,
): Promise<ApiResponse<MoneyBookCategory>> =>
  api.post<ApiResponse<MoneyBookCategory>>(`${BASE}/categories`, payload);

export const updateMoneyBookCategoryFn = (
  id: string,
  payload: Partial<CreateMoneyBookCategoryPayload>,
): Promise<ApiResponse<MoneyBookCategory>> =>
  api.patch<ApiResponse<MoneyBookCategory>>(`${BASE}/categories/${id}`, payload);

export const deleteMoneyBookCategoryFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/categories/${id}`);

export const createMoneyBookAccountFn = (
  name: string,
): Promise<ApiResponse<MoneyBookAccount>> =>
  api.post<ApiResponse<MoneyBookAccount>>(`${BASE}/accounts`, { name });

export const deleteMoneyBookAccountFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/accounts/${id}`);

// REACT QUERY: Query Keys

export const moneyBookKeys = {
  all: ["money-book"] as const,
  overview: (month?: string) =>
    [...moneyBookKeys.all, "overview", month ?? "now"] as const,
  entries: (params?: MoneyBookEntriesQueryParams) =>
    [...moneyBookKeys.all, "entries", params ?? {}] as const,
  reports: (month?: string, months?: number) =>
    [...moneyBookKeys.all, "reports", month ?? "now", months ?? 6] as const,
  meta: () => [...moneyBookKeys.all, "meta"] as const,
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

export const useGetMoneyBookOverview = (
  month?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<MoneyBookOverviewData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<MoneyBookOverviewData>, AxiosError>({
    queryKey: moneyBookKeys.overview(month),
    queryFn: () => getMoneyBookOverviewFn(month),
    ...options,
  });

export const useGetMoneyBookEntries = (
  params?: MoneyBookEntriesQueryParams,
  options?: Partial<
    UseQueryOptions<ApiResponse<MoneyBookEntriesData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<MoneyBookEntriesData>, AxiosError>({
    queryKey: moneyBookKeys.entries(params),
    queryFn: () => getMoneyBookEntriesFn(params),
    ...options,
  });

export const useGetMoneyBookReports = (
  month?: string,
  months?: number,
  options?: Partial<
    UseQueryOptions<ApiResponse<MoneyBookReportsData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<MoneyBookReportsData>, AxiosError>({
    queryKey: moneyBookKeys.reports(month, months),
    queryFn: () => getMoneyBookReportsFn(month, months),
    ...options,
  });

export const useGetMoneyBookMeta = (
  options?: Partial<UseQueryOptions<ApiResponse<MoneyBookMetaData>, AxiosError>>,
) =>
  useQuery<ApiResponse<MoneyBookMetaData>, AxiosError>({
    queryKey: moneyBookKeys.meta(),
    queryFn: () => getMoneyBookMetaFn(),
    ...options,
  });

// REACT QUERY: Mutations

const useBookMutation = <TData extends { message: string }, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
) => {
  const qc = useQueryClient();
  return useMutation<TData, AxiosError, TVars>({
    mutationFn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: moneyBookKeys.all });
      // Money Book spending feeds the Finance formula too
      qc.invalidateQueries({ queryKey: ["finance"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreateMoneyBookEntry = () =>
  useBookMutation<ApiResponse<MoneyBookEntry>, CreateMoneyBookEntryPayload>(
    createMoneyBookEntryFn,
  );
export const useUpdateMoneyBookEntry = () =>
  useBookMutation<
    ApiResponse<MoneyBookEntry>,
    { id: string; payload: UpdateMoneyBookEntryPayload }
  >(({ id, payload }) => updateMoneyBookEntryFn(id, payload));
export const useDeleteMoneyBookEntry = () =>
  useBookMutation<ApiResponse<undefined>, string>(deleteMoneyBookEntryFn);
export const useCreateMoneyBookCategory = () =>
  useBookMutation<ApiResponse<MoneyBookCategory>, CreateMoneyBookCategoryPayload>(
    createMoneyBookCategoryFn,
  );
export const useUpdateMoneyBookCategory = () =>
  useBookMutation<
    ApiResponse<MoneyBookCategory>,
    { id: string; payload: Partial<CreateMoneyBookCategoryPayload> }
  >(({ id, payload }) => updateMoneyBookCategoryFn(id, payload));
export const useDeleteMoneyBookCategory = () =>
  useBookMutation<ApiResponse<undefined>, string>(deleteMoneyBookCategoryFn);
export const useCreateMoneyBookAccount = () =>
  useBookMutation<ApiResponse<MoneyBookAccount>, string>(createMoneyBookAccountFn);
export const useDeleteMoneyBookAccount = () =>
  useBookMutation<ApiResponse<undefined>, string>(deleteMoneyBookAccountFn);
