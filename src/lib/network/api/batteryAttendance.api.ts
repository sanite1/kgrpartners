import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  AttendanceData,
  AttendanceMark,
  AttendanceSession,
  AttendanceRegister,
  AttendanceCompareData,
  MarkAttendancePayload,
  AttendanceDayRow,
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

export const getAttendanceFn = (
  session: AttendanceSession,
  register: AttendanceRegister,
  date?: string,
): Promise<ApiResponse<AttendanceData>> =>
  api.get<ApiResponse<AttendanceData>>(BASE, { session, register, date });

export const getAttendanceCompareFn = (
  session: AttendanceSession,
  date?: string,
): Promise<ApiResponse<AttendanceCompareData>> =>
  api.get<ApiResponse<AttendanceCompareData>>(`${BASE}/compare`, {
    session,
    date,
  });

export const markAttendanceFn = (
  payload: MarkAttendancePayload,
): Promise<ApiResponse<AttendanceMark>> =>
  api.post<ApiResponse<AttendanceMark>>(BASE, payload);

export const getAttendanceDaysFn = (params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<AttendanceDayRow>> =>
  api.get<PaginatedResponse<AttendanceDayRow>>(`${BASE}/days`, params);

export const clearAttendanceFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const attendanceKeys = {
  all: ["battery-attendance"] as const,
  sheet: (
    session: AttendanceSession,
    register: AttendanceRegister,
    date?: string,
  ) =>
    [
      ...attendanceKeys.all,
      "sheet",
      session,
      register,
      date ?? "today",
    ] as const,
  compare: (session: AttendanceSession, date?: string) =>
    [...attendanceKeys.all, "compare", session, date ?? "today"] as const,
  days: (page?: number, pageSize?: number) =>
    [...attendanceKeys.all, "days", page ?? 1, pageSize ?? 20] as const,
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

export const useGetAttendance = (
  session: AttendanceSession,
  register: AttendanceRegister,
  date?: string,
  options?: Partial<UseQueryOptions<ApiResponse<AttendanceData>, AxiosError>>,
) =>
  useQuery<ApiResponse<AttendanceData>, AxiosError>({
    queryKey: attendanceKeys.sheet(session, register, date),
    queryFn: () => getAttendanceFn(session, register, date),
    ...options,
  });

export const useGetAttendanceCompare = (
  session: AttendanceSession,
  date?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<AttendanceCompareData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<AttendanceCompareData>, AxiosError>({
    queryKey: attendanceKeys.compare(session, date),
    queryFn: () => getAttendanceCompareFn(session, date),
    ...options,
  });

export const useGetAttendanceDays = (
  page?: number,
  pageSize?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<AttendanceDayRow>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<AttendanceDayRow>, AxiosError>({
    queryKey: attendanceKeys.days(page, pageSize),
    queryFn: () => getAttendanceDaysFn({ page, pageSize }),
    ...options,
  });

// REACT QUERY: Mutations

export const useMarkAttendance = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<AttendanceMark>,
    AxiosError,
    MarkAttendancePayload
  >({
    mutationFn: (payload) => markAttendanceFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useClearAttendance = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => clearAttendanceFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
