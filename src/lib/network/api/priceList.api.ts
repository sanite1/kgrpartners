import { api } from "../api";
import type { ApiResponse, ApiErrorResponse } from "../types/api.types";
import type {
  PriceListData,
  PriceListItem,
  CreatePriceItemPayload,
  UpdatePriceItemPayload,
  UpdatePriceSettingsPayload,
} from "../types/priceList.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/price-list";

// RAW API FUNCTIONS

export const getPriceListFn = (): Promise<ApiResponse<PriceListData>> =>
  api.get<ApiResponse<PriceListData>>(BASE);

export const createPriceItemFn = (
  payload: CreatePriceItemPayload,
): Promise<ApiResponse<PriceListItem>> =>
  api.post<ApiResponse<PriceListItem>>(`${BASE}/items`, payload);

export const updatePriceItemFn = (
  id: string,
  payload: UpdatePriceItemPayload,
): Promise<ApiResponse<PriceListItem>> =>
  api.patch<ApiResponse<PriceListItem>>(`${BASE}/items/${id}`, payload);

export const deletePriceItemFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/items/${id}`);

export const updatePriceSettingsFn = (
  payload: UpdatePriceSettingsPayload,
): Promise<ApiResponse<Omit<PriceListData, "items">>> =>
  api.patch<ApiResponse<Omit<PriceListData, "items">>>(
    `${BASE}/settings`,
    payload,
  );

// REACT QUERY: Query Keys

export const priceListKeys = {
  all: ["price-list"] as const,
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

export const useGetPriceList = (
  options?: Partial<UseQueryOptions<ApiResponse<PriceListData>, AxiosError>>,
) =>
  useQuery<ApiResponse<PriceListData>, AxiosError>({
    queryKey: priceListKeys.all,
    queryFn: () => getPriceListFn(),
    ...options,
  });

// REACT QUERY: Mutations

const usePriceListMutation = <TVars, TData>(
  fn: (vars: TVars) => Promise<ApiResponse<TData>>,
) => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<TData>, AxiosError, TVars>({
    mutationFn: fn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: priceListKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreatePriceItem = () =>
  usePriceListMutation<CreatePriceItemPayload, PriceListItem>((payload) =>
    createPriceItemFn(payload),
  );

export const useUpdatePriceItem = () =>
  usePriceListMutation<
    { id: string; payload: UpdatePriceItemPayload },
    PriceListItem
  >(({ id, payload }) => updatePriceItemFn(id, payload));

export const useDeletePriceItem = () =>
  usePriceListMutation<string, undefined>((id) => deletePriceItemFn(id));

export const useUpdatePriceSettings = () =>
  usePriceListMutation<
    UpdatePriceSettingsPayload,
    Omit<PriceListData, "items">
  >((payload) => updatePriceSettingsFn(payload));
