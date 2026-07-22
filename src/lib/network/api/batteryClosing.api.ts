import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  BatteryClosingEntry,
  ClosingReportData,
  CreateClosingEntryPayload,
  ClosingDayRow,
} from "../types/batteryClosing.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/battery-closing";

// RAW API FUNCTIONS

export const getClosingReportFn = (
  date?: string,
): Promise<ApiResponse<ClosingReportData>> =>
  api.get<ApiResponse<ClosingReportData>>(BASE, { date });

export const createClosingEntryFn = (
  payload: CreateClosingEntryPayload,
): Promise<ApiResponse<BatteryClosingEntry>> =>
  api.post<ApiResponse<BatteryClosingEntry>>(BASE, payload);

export const getClosingDaysFn = (params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ClosingDayRow>> =>
  api.get<PaginatedResponse<ClosingDayRow>>(`${BASE}/days`, params);

export const deleteClosingEntryFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const closingKeys = {
  all: ["battery-closing"] as const,
  report: (date?: string) =>
    [...closingKeys.all, "report", date ?? "today"] as const,
  days: (page?: number, pageSize?: number) =>
    [...closingKeys.all, "days", page ?? 1, pageSize ?? 20] as const,
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

export const useGetClosingReport = (
  date?: string,
  options?: Partial<UseQueryOptions<ApiResponse<ClosingReportData>, AxiosError>>,
) =>
  useQuery<ApiResponse<ClosingReportData>, AxiosError>({
    queryKey: closingKeys.report(date),
    queryFn: () => getClosingReportFn(date),
    ...options,
  });

export const useGetClosingDays = (
  page?: number,
  pageSize?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<ClosingDayRow>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<ClosingDayRow>, AxiosError>({
    queryKey: closingKeys.days(page, pageSize),
    queryFn: () => getClosingDaysFn({ page, pageSize }),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateClosingEntry = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<BatteryClosingEntry>,
    AxiosError,
    CreateClosingEntryPayload
  >({
    mutationFn: (payload) => createClosingEntryFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: closingKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteClosingEntry = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteClosingEntryFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: closingKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
