import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  BatterySwap,
  CreateBatterySwapPayload,
  BatterySwapsQueryParams,
} from "../types/batterySwap.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/battery-swaps";

// RAW API FUNCTIONS

export const getSwapsFn = (
  params?: BatterySwapsQueryParams,
): Promise<PaginatedResponse<BatterySwap>> =>
  api.get<PaginatedResponse<BatterySwap>>(BASE, params);

export const createSwapFn = (
  payload: CreateBatterySwapPayload,
): Promise<ApiResponse<BatterySwap>> =>
  api.post<ApiResponse<BatterySwap>>(BASE, payload);

// REACT QUERY: Query Keys

export const swapKeys = {
  all: ["battery-swaps"] as const,
  list: (params?: BatterySwapsQueryParams) =>
    [...swapKeys.all, "list", params ?? {}] as const,
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

export const useGetSwaps = (
  params?: BatterySwapsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<BatterySwap>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<BatterySwap>, AxiosError>({
    queryKey: swapKeys.list(params),
    queryFn: () => getSwapsFn(params),
    ...options,
  });

// REACT QUERY: Mutations
// A swap moves packs between buses, so batteries refresh alongside swaps.

export const useCreateSwap = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<BatterySwap>,
    AxiosError,
    CreateBatterySwapPayload
  >({
    mutationFn: (payload) => createSwapFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      // the checklist "vs Receipts" view reads receipts and swaps too
      qc.invalidateQueries({ queryKey: ["checklists", "compare-receipts"] });
      qc.invalidateQueries({ queryKey: swapKeys.all });
      qc.invalidateQueries({ queryKey: ["batteries"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
