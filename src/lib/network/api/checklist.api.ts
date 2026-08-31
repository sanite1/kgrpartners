import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  ChecklistData,
  ChecklistEntry,
  ChecklistKind,
  ChecklistCompareData,
  CreateChecklistEntryPayload,
  ChecklistDayRow,
  ChecklistReceiptsCompareData,
} from "../types/checklist.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/checklists";

// RAW API FUNCTIONS

export const getChecklistFn = (
  kind: ChecklistKind,
  date?: string,
): Promise<ApiResponse<ChecklistData>> =>
  api.get<ApiResponse<ChecklistData>>(BASE, { kind, date });

export const createChecklistEntryFn = (
  payload: CreateChecklistEntryPayload,
): Promise<ApiResponse<ChecklistEntry>> =>
  api.post<ApiResponse<ChecklistEntry>>(BASE, payload);

export const getChecklistCompareFn = (
  date?: string,
): Promise<ApiResponse<ChecklistCompareData>> =>
  api.get<ApiResponse<ChecklistCompareData>>(`${BASE}/compare`, { date });

export const getChecklistReceiptsCompareFn = (
  date?: string,
): Promise<ApiResponse<ChecklistReceiptsCompareData>> =>
  api.get<ApiResponse<ChecklistReceiptsCompareData>>(
    `${BASE}/compare-receipts`,
    { date },
  );

export const getChecklistDaysFn = (params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ChecklistDayRow>> =>
  api.get<PaginatedResponse<ChecklistDayRow>>(`${BASE}/days`, params);

export const updateChecklistEntryFn = (
  id: string,
  payload: { batteryName?: string; trips?: number; note?: string },
): Promise<ApiResponse<ChecklistEntry>> =>
  api.patch<ApiResponse<ChecklistEntry>>(`${BASE}/${id}`, payload);

export const deleteChecklistEntryFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const checklistKeys = {
  all: ["checklists"] as const,
  sheet: (kind: ChecklistKind, date?: string) =>
    [...checklistKeys.all, "sheet", kind, date ?? "today"] as const,
  compare: (date?: string) =>
    [...checklistKeys.all, "compare", date ?? "today"] as const,
  compareReceipts: (date?: string) =>
    [...checklistKeys.all, "compare-receipts", date ?? "today"] as const,
  days: (page?: number, pageSize?: number) =>
    [...checklistKeys.all, "days", page ?? 1, pageSize ?? 20] as const,
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

export const useGetChecklist = (
  kind: ChecklistKind,
  date?: string,
  options?: Partial<UseQueryOptions<ApiResponse<ChecklistData>, AxiosError>>,
) =>
  useQuery<ApiResponse<ChecklistData>, AxiosError>({
    queryKey: checklistKeys.sheet(kind, date),
    queryFn: () => getChecklistFn(kind, date),
    ...options,
  });

export const useGetChecklistCompare = (
  date?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<ChecklistCompareData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<ChecklistCompareData>, AxiosError>({
    queryKey: checklistKeys.compare(date),
    queryFn: () => getChecklistCompareFn(date),
    ...options,
  });

export const useGetChecklistReceiptsCompare = (
  date?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<ChecklistReceiptsCompareData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<ChecklistReceiptsCompareData>, AxiosError>({
    queryKey: checklistKeys.compareReceipts(date),
    queryFn: () => getChecklistReceiptsCompareFn(date),
    ...options,
  });

export const useGetChecklistDays = (
  page?: number,
  pageSize?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<ChecklistDayRow>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<ChecklistDayRow>, AxiosError>({
    queryKey: checklistKeys.days(page, pageSize),
    queryFn: () => getChecklistDaysFn({ page, pageSize }),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateChecklistEntry = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ChecklistEntry>,
    AxiosError,
    CreateChecklistEntryPayload
  >({
    mutationFn: (payload) => createChecklistEntryFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: checklistKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateChecklistEntry = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ChecklistEntry>,
    AxiosError,
    { id: string; payload: { batteryName?: string; trips?: number; note?: string } }
  >({
    mutationFn: ({ id, payload }) => updateChecklistEntryFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: checklistKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteChecklistEntry = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteChecklistEntryFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: checklistKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
