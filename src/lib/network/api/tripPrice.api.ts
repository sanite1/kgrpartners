import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  TripPrice,
  SetTripPricePayload,
  TripPriceHistoryQueryParams,
} from "../types/tripPrice.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/trip-price";

// RAW API FUNCTIONS

// GET /api/trip-price/current: the price in force now, or null.
export const getCurrentTripPriceFn = (): Promise<
  ApiResponse<TripPrice | null>
> => api.get<ApiResponse<TripPrice | null>>(`${BASE}/current`);

// GET /api/trip-price/history: paginated changes, newest first.
export const getTripPriceHistoryFn = (
  params?: TripPriceHistoryQueryParams,
): Promise<PaginatedResponse<TripPrice>> =>
  api.get<PaginatedResponse<TripPrice>>(`${BASE}/history`, params);

// POST /api/trip-price (admin). ApiResponse(201, "Trip price set successfully").
export const setTripPriceFn = (
  payload: SetTripPricePayload,
): Promise<ApiResponse<TripPrice>> =>
  api.post<ApiResponse<TripPrice>>(BASE, payload);

// REACT QUERY: Query Keys

export const tripPriceKeys = {
  all: ["tripPrice"] as const,
  current: () => [...tripPriceKeys.all, "current"] as const,
  history: (params?: TripPriceHistoryQueryParams) =>
    [...tripPriceKeys.all, "history", params ?? {}] as const,
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

export const useGetCurrentTripPrice = (
  options?: Partial<UseQueryOptions<ApiResponse<TripPrice | null>, AxiosError>>,
) =>
  useQuery<ApiResponse<TripPrice | null>, AxiosError>({
    queryKey: tripPriceKeys.current(),
    queryFn: () => getCurrentTripPriceFn(),
    ...options,
  });

export const useGetTripPriceHistory = (
  params?: TripPriceHistoryQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<TripPrice>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<TripPrice>, AxiosError>({
    queryKey: tripPriceKeys.history(params),
    queryFn: () => getTripPriceHistoryFn(params),
    ...options,
  });

// REACT QUERY: Mutations

export const useSetTripPrice = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<TripPrice>, AxiosError, SetTripPricePayload>({
    mutationFn: (payload) => setTripPriceFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: tripPriceKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
