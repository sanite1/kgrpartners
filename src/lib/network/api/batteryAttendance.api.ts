import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  AttendanceFleetData,
  AttendanceLog,
  AttendanceCompareData,
  CreateAttendanceLogPayload,
} from "../types/batteryAttendance.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/battery-attendance";

// RAW API FUNCTIONS

export const getAttendanceFleetFn = (): Promise<
  ApiResponse<AttendanceFleetData>
> => api.get<ApiResponse<AttendanceFleetData>>(`${BASE}/fleet`);

export const createAttendanceLogFn = (
  payload: CreateAttendanceLogPayload,
): Promise<ApiResponse<AttendanceLog>> =>
  api.post<ApiResponse<AttendanceLog>>(`${BASE}/logs`, payload);

export const getAttendanceLogsFn = (params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<AttendanceLog>> =>
  api.get<PaginatedResponse<AttendanceLog>>(`${BASE}/logs`, params);

export const getAttendanceLogFn = (
  id: string,
): Promise<ApiResponse<AttendanceLog>> =>
  api.get<ApiResponse<AttendanceLog>>(`${BASE}/logs/${id}`);

export const getAttendanceCompareFn = (
  date?: string,
): Promise<ApiResponse<AttendanceCompareData>> =>
  api.get<ApiResponse<AttendanceCompareData>>(`${BASE}/compare`, { date });

export const deleteAttendanceLogFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/logs/${id}`);

// REACT QUERY: Query Keys

export const attendanceKeys = {
  all: ["battery-attendance"] as const,
  fleet: () => [...attendanceKeys.all, "fleet"] as const,
  logs: (page?: number, pageSize?: number) =>
    [...attendanceKeys.all, "logs", page ?? 1, pageSize ?? 20] as const,
  log: (id: string) => [...attendanceKeys.all, "log", id] as const,
  compare: (date?: string) =>
    [...attendanceKeys.all, "compare", date ?? "today"] as const,
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

export const useGetAttendanceFleet = (
  options?: Partial<
    UseQueryOptions<ApiResponse<AttendanceFleetData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<AttendanceFleetData>, AxiosError>({
    queryKey: attendanceKeys.fleet(),
    queryFn: () => getAttendanceFleetFn(),
    ...options,
  });

export const useGetAttendanceLogs = (
  page?: number,
  pageSize?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<AttendanceLog>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<AttendanceLog>, AxiosError>({
    queryKey: attendanceKeys.logs(page, pageSize),
    queryFn: () => getAttendanceLogsFn({ page, pageSize }),
    ...options,
  });

export const useGetAttendanceLog = (
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<AttendanceLog>, AxiosError>>,
) =>
  useQuery<ApiResponse<AttendanceLog>, AxiosError>({
    queryKey: attendanceKeys.log(id),
    queryFn: () => getAttendanceLogFn(id),
    enabled: !!id,
    ...options,
  });

export const useGetAttendanceCompare = (
  date?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<AttendanceCompareData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<AttendanceCompareData>, AxiosError>({
    queryKey: attendanceKeys.compare(date),
    queryFn: () => getAttendanceCompareFn(date),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateAttendanceLog = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<AttendanceLog>,
    AxiosError,
    CreateAttendanceLogPayload
  >({
    mutationFn: (payload) => createAttendanceLogFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteAttendanceLog = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteAttendanceLogFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
