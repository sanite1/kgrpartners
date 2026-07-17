import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  InventoryItem,
  StockMovement,
  CreateItemPayload,
  UpdateItemPayload,
  AdjustStockPayload,
  ItemsQueryParams,
} from "../types/inventory.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/inventory";

// RAW API FUNCTIONS

export const getItemsFn = (
  params?: ItemsQueryParams,
): Promise<PaginatedResponse<InventoryItem>> =>
  api.get<PaginatedResponse<InventoryItem>>(BASE, params);

export const createItemFn = (
  payload: CreateItemPayload,
): Promise<ApiResponse<InventoryItem>> =>
  api.post<ApiResponse<InventoryItem>>(BASE, payload);

export const updateItemFn = (
  id: string,
  payload: UpdateItemPayload,
): Promise<ApiResponse<InventoryItem>> =>
  api.patch<ApiResponse<InventoryItem>>(`${BASE}/${id}`, payload);

export const adjustStockFn = (
  id: string,
  payload: AdjustStockPayload,
): Promise<ApiResponse<InventoryItem>> =>
  api.post<ApiResponse<InventoryItem>>(`${BASE}/${id}/adjust`, payload);

export const getMovementsFn = (
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<StockMovement>> =>
  api.get<PaginatedResponse<StockMovement>>(`${BASE}/${id}/movements`, params);

// REACT QUERY: Query Keys

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (params?: ItemsQueryParams) =>
    [...inventoryKeys.all, "list", params ?? {}] as const,
  movements: (id: string, page?: number) =>
    [...inventoryKeys.all, "movements", id, page ?? 1] as const,
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

export const useGetItems = (
  params?: ItemsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<InventoryItem>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<InventoryItem>, AxiosError>({
    queryKey: inventoryKeys.list(params),
    queryFn: () => getItemsFn(params),
    ...options,
  });

export const useGetMovements = (
  id: string,
  page?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<StockMovement>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<StockMovement>, AxiosError>({
    queryKey: inventoryKeys.movements(id, page),
    queryFn: () => getMovementsFn(id, { page, pageSize: 20 }),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<InventoryItem>, AxiosError, CreateItemPayload>(
    {
      mutationFn: (payload) => createItemFn(payload),
      onSuccess: (data) => {
        toast.success(data.message);
        qc.invalidateQueries({ queryKey: inventoryKeys.all });
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    },
  );
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<InventoryItem>,
    AxiosError,
    { id: string; payload: UpdateItemPayload }
  >({
    mutationFn: ({ id, payload }) => updateItemFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<InventoryItem>,
    AxiosError,
    { id: string; payload: AdjustStockPayload }
  >({
    mutationFn: ({ id, payload }) => adjustStockFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
