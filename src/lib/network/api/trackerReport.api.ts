import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  TrackerReport,
  TrackerReportDetail,
  ParseResultData,
  CreateTrackerReportPayload,
  TrackerReportsQueryParams,
  MileageSummaryData,
} from "../types/trackerReport.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/tracker-reports";

// RAW API FUNCTIONS

export const parseTrackerTextFn = (
  text: string,
): Promise<ApiResponse<ParseResultData>> =>
  api.post<ApiResponse<ParseResultData>>(`${BASE}/parse`, { text });

export const createTrackerReportFn = (
  payload: CreateTrackerReportPayload,
): Promise<ApiResponse<TrackerReport>> =>
  api.post<ApiResponse<TrackerReport>>(BASE, payload);

export const getTrackerReportsFn = (
  params?: TrackerReportsQueryParams,
): Promise<PaginatedResponse<TrackerReport>> =>
  api.get<PaginatedResponse<TrackerReport>>(BASE, params);

export const getTrackerReportFn = (
  id: string,
): Promise<ApiResponse<TrackerReportDetail>> =>
  api.get<ApiResponse<TrackerReportDetail>>(`${BASE}/${id}`);

export const getMileageSummaryFn = (
  month?: string,
): Promise<ApiResponse<MileageSummaryData>> =>
  api.get<ApiResponse<MileageSummaryData>>(`${BASE}/mileage`, { month });

// REACT QUERY: Query Keys

export const trackerKeys = {
  all: ["tracker-reports"] as const,
  list: (params?: TrackerReportsQueryParams) =>
    [...trackerKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...trackerKeys.all, "detail", id] as const,
  mileage: (month?: string) =>
    [...trackerKeys.all, "mileage", month ?? "current"] as const,
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

export const useGetTrackerReports = (
  params?: TrackerReportsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<TrackerReport>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<TrackerReport>, AxiosError>({
    queryKey: trackerKeys.list(params),
    queryFn: () => getTrackerReportsFn(params),
    ...options,
  });

export const useGetTrackerReport = (
  id: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<TrackerReportDetail>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<TrackerReportDetail>, AxiosError>({
    queryKey: trackerKeys.detail(id),
    queryFn: () => getTrackerReportFn(id),
    enabled: !!id,
    ...options,
  });

export const useGetMileageSummary = (
  month?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<MileageSummaryData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<MileageSummaryData>, AxiosError>({
    queryKey: trackerKeys.mileage(month),
    queryFn: () => getMileageSummaryFn(month),
    ...options,
  });

// REACT QUERY: Mutations

export const useParseTrackerText = () =>
  useMutation<ApiResponse<ParseResultData>, AxiosError, string>({
    mutationFn: (text) => parseTrackerTextFn(text),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

export const useCreateTrackerReport = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<TrackerReport>,
    AxiosError<ApiErrorResponse>,
    CreateTrackerReportPayload
  >({
    mutationFn: (payload) => createTrackerReportFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
    onError: (error) => {
      // 409 (report exists) is handled by the page's replace confirm
      if (error.response?.status === 409) return;
      toast.error(getErrorMessage(error));
    },
  });
};
