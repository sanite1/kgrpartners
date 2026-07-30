import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Bus,
  CreateBusPayload,
  UpdateBusPayload,
  BusesQueryParams,
  BusPerformanceData,
  BusPerformanceQueryParams,
  BusTripsData,
  BusTripsQueryParams,
} from "../types/bus.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/buses";

// RAW API FUNCTIONS

// GET /api/buses: paginated registry. PaginatedResponse<Bus>.
export const getBusesFn = (
  params?: BusesQueryParams,
): Promise<PaginatedResponse<Bus>> =>
  api.get<PaginatedResponse<Bus>>(BASE, params);

// GET /api/buses/:id. ApiResponse<Bus>.
export const getBusFn = (id: string): Promise<ApiResponse<Bus>> =>
  api.get<ApiResponse<Bus>>(`${BASE}/${id}`);

// POST /api/buses. ApiResponse(201, "Bus registered successfully", bus).
export const createBusFn = (
  payload: CreateBusPayload,
): Promise<ApiResponse<Bus>> => api.post<ApiResponse<Bus>>(BASE, payload);

// PATCH /api/buses/:id (admin). ApiResponse(200, "Bus updated successfully", bus).
export const updateBusFn = (
  id: string,
  payload: UpdateBusPayload,
): Promise<ApiResponse<Bus>> =>
  api.patch<ApiResponse<Bus>>(`${BASE}/${id}`, payload);

// GET /api/buses/performance: the fleet judged against the daily minimum.
export const getBusPerformanceFn = (
  params?: BusPerformanceQueryParams,
): Promise<ApiResponse<BusPerformanceData>> =>
  api.get<ApiResponse<BusPerformanceData>>(`${BASE}/performance`, params);

// GET /api/buses/:id/trips: the bus's trip history from its receipts.
export const getBusTripsFn = (
  id: string,
  params?: BusTripsQueryParams,
): Promise<ApiResponse<BusTripsData>> =>
  api.get<ApiResponse<BusTripsData>>(`${BASE}/${id}/trips`, params);

// REACT QUERY: Query Keys

export const busKeys = {
  all: ["buses"] as const,
  list: (params?: BusesQueryParams) =>
    [...busKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...busKeys.all, "detail", id] as const,
  trips: (id: string, params?: BusTripsQueryParams) =>
    [...busKeys.all, "trips", id, params ?? {}] as const,
  performance: (params?: BusPerformanceQueryParams) =>
    [...busKeys.all, "performance", params ?? {}] as const,
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

export const useGetBuses = (
  params?: BusesQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<Bus>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<Bus>, AxiosError>({
    queryKey: busKeys.list(params),
    queryFn: () => getBusesFn(params),
    ...options,
  });

export const useGetBusPerformance = (
  params?: BusPerformanceQueryParams,
  options?: Partial<
    UseQueryOptions<ApiResponse<BusPerformanceData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<BusPerformanceData>, AxiosError>({
    queryKey: busKeys.performance(params),
    queryFn: () => getBusPerformanceFn(params),
    ...options,
  });

export const useGetBusTrips = (
  id: string,
  params?: BusTripsQueryParams,
  options?: Partial<UseQueryOptions<ApiResponse<BusTripsData>, AxiosError>>,
) =>
  useQuery<ApiResponse<BusTripsData>, AxiosError>({
    queryKey: busKeys.trips(id, params),
    queryFn: () => getBusTripsFn(id, params),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateBus = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Bus>, AxiosError, CreateBusPayload>({
    mutationFn: (payload) => createBusFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: busKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateBus = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Bus>,
    AxiosError,
    { id: string; payload: UpdateBusPayload }
  >({
    mutationFn: ({ id, payload }) => updateBusFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: busKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
