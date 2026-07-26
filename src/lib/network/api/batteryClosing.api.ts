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
  ClosingSheetKey,
} from "../types/batteryClosing.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

// each sheet lives behind its own base URL and access toggle
const SHEET_BASE: Record<ClosingSheetKey, string> = {
  main: "/api/battery-closing",
  muhd_kamila: "/api/house-closing",
};

// RAW API FUNCTIONS

export const getClosingReportFn = (
  sheet: ClosingSheetKey,
  date?: string,
): Promise<ApiResponse<ClosingReportData>> =>
  api.get<ApiResponse<ClosingReportData>>(SHEET_BASE[sheet], { date });

export const createClosingEntryFn = (
  sheet: ClosingSheetKey,
  payload: CreateClosingEntryPayload,
): Promise<ApiResponse<BatteryClosingEntry>> =>
  api.post<ApiResponse<BatteryClosingEntry>>(SHEET_BASE[sheet], payload);

export const getClosingDaysFn = (
  sheet: ClosingSheetKey,
  params?: {
    page?: number;
    pageSize?: number;
  },
): Promise<PaginatedResponse<ClosingDayRow>> =>
  api.get<PaginatedResponse<ClosingDayRow>>(
    `${SHEET_BASE[sheet]}/days`,
    params,
  );

export const deleteClosingEntryFn = (
  sheet: ClosingSheetKey,
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${SHEET_BASE[sheet]}/${id}`);

// REACT QUERY: Query Keys

export const closingKeys = {
  all: ["battery-closing"] as const,
  report: (sheet: ClosingSheetKey, date?: string) =>
    [...closingKeys.all, "report", sheet, date ?? "today"] as const,
  days: (sheet: ClosingSheetKey, page?: number, pageSize?: number) =>
    [...closingKeys.all, "days", sheet, page ?? 1, pageSize ?? 20] as const,
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

export const useGetClosingReport = (
  sheet: ClosingSheetKey,
  date?: string,
  options?: Partial<UseQueryOptions<ApiResponse<ClosingReportData>, AxiosError>>,
) =>
  useQuery<ApiResponse<ClosingReportData>, AxiosError>({
    queryKey: closingKeys.report(sheet, date),
    queryFn: () => getClosingReportFn(sheet, date),
    ...options,
  });

export const useGetClosingDays = (
  sheet: ClosingSheetKey,
  page?: number,
  pageSize?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<ClosingDayRow>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<ClosingDayRow>, AxiosError>({
    queryKey: closingKeys.days(sheet, page, pageSize),
    queryFn: () => getClosingDaysFn(sheet, { page, pageSize }),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateClosingEntry = (sheet: ClosingSheetKey) => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<BatteryClosingEntry>,
    AxiosError,
    CreateClosingEntryPayload
  >({
    mutationFn: (payload) => createClosingEntryFn(sheet, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: closingKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteClosingEntry = (sheet: ClosingSheetKey) => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteClosingEntryFn(sheet, id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: closingKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
