import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  WarehouseItem,
  WarehouseMovement,
  CreateWarehouseItemPayload,
  UpdateWarehouseItemPayload,
  AdjustWarehouseStockPayload,
  WarehouseItemsQueryParams,
} from "../types/warehouse.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/warehouse";

// RAW API FUNCTIONS

export const getWarehouseItemsFn = (
  params?: WarehouseItemsQueryParams,
): Promise<PaginatedResponse<WarehouseItem>> =>
  api.get<PaginatedResponse<WarehouseItem>>(BASE, params);

export const createWarehouseItemFn = (
  payload: CreateWarehouseItemPayload,
): Promise<ApiResponse<WarehouseItem>> =>
  api.post<ApiResponse<WarehouseItem>>(BASE, payload);

export const updateWarehouseItemFn = (
  id: string,
  payload: UpdateWarehouseItemPayload,
): Promise<ApiResponse<WarehouseItem>> =>
  api.patch<ApiResponse<WarehouseItem>>(`${BASE}/${id}`, payload);

export const adjustWarehouseStockFn = (
  id: string,
  payload: AdjustWarehouseStockPayload,
): Promise<ApiResponse<WarehouseItem>> =>
  api.post<ApiResponse<WarehouseItem>>(`${BASE}/${id}/adjust`, payload);

export const getWarehouseMovementsFn = (
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<WarehouseMovement>> =>
  api.get<PaginatedResponse<WarehouseMovement>>(
    `${BASE}/${id}/movements`,
    params,
  );

// REACT QUERY: Query Keys

export const warehouseKeys = {
  all: ["warehouse"] as const,
  list: (params?: WarehouseItemsQueryParams) =>
    [...warehouseKeys.all, "list", params ?? {}] as const,
  movements: (id: string, page?: number) =>
    [...warehouseKeys.all, "movements", id, page ?? 1] as const,
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

export const useGetWarehouseItems = (
  params?: WarehouseItemsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<WarehouseItem>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<WarehouseItem>, AxiosError>({
    queryKey: warehouseKeys.list(params),
    queryFn: () => getWarehouseItemsFn(params),
    ...options,
  });

export const useGetWarehouseMovements = (
  id: string,
  page?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<WarehouseMovement>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<WarehouseMovement>, AxiosError>({
    queryKey: warehouseKeys.movements(id, page),
    queryFn: () => getWarehouseMovementsFn(id, { page, pageSize: 20 }),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateWarehouseItem = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<WarehouseItem>,
    AxiosError,
    CreateWarehouseItemPayload
  >({
    mutationFn: (payload) => createWarehouseItemFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateWarehouseItem = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<WarehouseItem>,
    AxiosError,
    { id: string; payload: UpdateWarehouseItemPayload }
  >({
    mutationFn: ({ id, payload }) => updateWarehouseItemFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useAdjustWarehouseStock = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<WarehouseItem>,
    AxiosError,
    { id: string; payload: AdjustWarehouseStockPayload }
  >({
    mutationFn: ({ id, payload }) => adjustWarehouseStockFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: warehouseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
