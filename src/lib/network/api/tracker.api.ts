import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Tracker,
  TrackerUpdateEntry,
  TrackerSummaryData,
  CreateTrackerPayload,
  UpdateTrackerPayload,
  TrackersQueryParams,
} from "../types/tracker.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/trackers";

// RAW API FUNCTIONS

export const getTrackersFn = (
  params?: TrackersQueryParams,
): Promise<PaginatedResponse<Tracker>> =>
  api.get<PaginatedResponse<Tracker>>(BASE, params);

export const getTrackerSummaryFn = (): Promise<
  ApiResponse<TrackerSummaryData>
> => api.get<ApiResponse<TrackerSummaryData>>(`${BASE}/summary`);

export const createTrackerFn = (
  payload: CreateTrackerPayload,
): Promise<ApiResponse<Tracker>> =>
  api.post<ApiResponse<Tracker>>(BASE, payload);

export const updateTrackerFn = (
  id: string,
  payload: UpdateTrackerPayload,
): Promise<ApiResponse<Tracker>> =>
  api.post<ApiResponse<Tracker>>(`${BASE}/${id}/update`, payload);

export const getTrackerUpdatesFn = (
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<TrackerUpdateEntry>> =>
  api.get<PaginatedResponse<TrackerUpdateEntry>>(
    `${BASE}/${id}/updates`,
    params,
  );

export const deleteTrackerFn = (id: string): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const trackerKeys = {
  all: ["trackers"] as const,
  list: (params?: TrackersQueryParams) =>
    [...trackerKeys.all, "list", params ?? {}] as const,
  summary: () => [...trackerKeys.all, "summary"] as const,
  updates: (id: string, page?: number) =>
    [...trackerKeys.all, "updates", id, page ?? 1] as const,
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

export const useGetTrackers = (
  params?: TrackersQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<Tracker>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<Tracker>, AxiosError>({
    queryKey: trackerKeys.list(params),
    queryFn: () => getTrackersFn(params),
    ...options,
  });

export const useGetTrackerSummary = (
  options?: Partial<
    UseQueryOptions<ApiResponse<TrackerSummaryData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<TrackerSummaryData>, AxiosError>({
    queryKey: trackerKeys.summary(),
    queryFn: () => getTrackerSummaryFn(),
    ...options,
  });

export const useGetTrackerUpdates = (
  id: string,
  page?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<TrackerUpdateEntry>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<TrackerUpdateEntry>, AxiosError>({
    queryKey: trackerKeys.updates(id, page),
    queryFn: () => getTrackerUpdatesFn(id, { page }),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateTracker = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Tracker>, AxiosError, CreateTrackerPayload>({
    mutationFn: (payload) => createTrackerFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateTracker = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Tracker>,
    AxiosError,
    { id: string; payload: UpdateTrackerPayload }
  >({
    mutationFn: ({ id, payload }) => updateTrackerFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useDeleteTracker = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteTrackerFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
