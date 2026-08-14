import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  HijetEntry,
  HijetSummaryData,
  CreateHijetEntryPayload,
  HijetEntriesQueryParams,
} from "../types/hijet.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/hijet";

// RAW API FUNCTIONS

export const getHijetEntriesFn = (
  params?: HijetEntriesQueryParams,
): Promise<PaginatedResponse<HijetEntry>> =>
  api.get<PaginatedResponse<HijetEntry>>(BASE, params);

export const getHijetSummaryFn = (): Promise<ApiResponse<HijetSummaryData>> =>
  api.get<ApiResponse<HijetSummaryData>>(`${BASE}/summary`);

export const createHijetEntryFn = (
  payload: CreateHijetEntryPayload,
): Promise<ApiResponse<HijetEntry>> =>
  api.post<ApiResponse<HijetEntry>>(BASE, payload);

export const deleteHijetEntryFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const hijetKeys = {
  all: ["hijet"] as const,
  list: (params?: HijetEntriesQueryParams) =>
    [...hijetKeys.all, "list", params ?? {}] as const,
  summary: () => [...hijetKeys.all, "summary"] as const,
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

export const useGetHijetEntries = (
  params?: HijetEntriesQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<HijetEntry>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<HijetEntry>, AxiosError>({
    queryKey: hijetKeys.list(params),
    queryFn: () => getHijetEntriesFn(params),
    ...options,
  });

export const useGetHijetSummary = (
  options?: Partial<UseQueryOptions<ApiResponse<HijetSummaryData>, AxiosError>>,
) =>
  useQuery<ApiResponse<HijetSummaryData>, AxiosError>({
    queryKey: hijetKeys.summary(),
    queryFn: () => getHijetSummaryFn(),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateHijetEntry = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<HijetEntry>,
    AxiosError,
    CreateHijetEntryPayload
  >({
    mutationFn: (payload) => createHijetEntryFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: hijetKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteHijetEntry = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteHijetEntryFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: hijetKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
