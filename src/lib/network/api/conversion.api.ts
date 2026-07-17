import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  ConversionRequest,
  SubmitConversionPayload,
  UpdateConversionStatusPayload,
  ConversionsQueryParams,
} from "../types/conversion.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/conversions";

// RAW API FUNCTIONS

// POST /api/conversions: public, no auth. Service returns
// ApiResponse(201, "...", { id, requestId }).
export const submitConversionFn = (
  payload: SubmitConversionPayload,
): Promise<ApiResponse<{ id: string; requestId: number }>> =>
  api.post<ApiResponse<{ id: string; requestId: number }>>(BASE, payload);

export const getConversionsFn = (
  params?: ConversionsQueryParams,
): Promise<PaginatedResponse<ConversionRequest>> =>
  api.get<PaginatedResponse<ConversionRequest>>(BASE, params);

export const updateConversionStatusFn = (
  id: string,
  payload: UpdateConversionStatusPayload,
): Promise<ApiResponse<ConversionRequest>> =>
  api.patch<ApiResponse<ConversionRequest>>(`${BASE}/${id}/status`, payload);

// REACT QUERY: Query Keys

export const conversionKeys = {
  all: ["conversions"] as const,
  list: (params?: ConversionsQueryParams) =>
    [...conversionKeys.all, "list", params ?? {}] as const,
} as const;

// Error helper

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message;
  }
  return "An unexpected error occurred";
};

// REACT QUERY: public submit mutation (no toast: the form handles errors)

export const useSubmitConversion = () =>
  useMutation<
    ApiResponse<{ id: string; requestId: number }>,
    AxiosError<ApiErrorResponse>,
    SubmitConversionPayload
  >({
    mutationFn: (payload) => submitConversionFn(payload),
    onError: (error) => {
      const data = error.response?.data;
      if (error.response?.status === 400 && data?.fields?.length) return;
      toast.error(getErrorMessage(error));
    },
  });

// REACT QUERY: console queries and mutations

export const useGetConversions = (
  params?: ConversionsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<ConversionRequest>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<ConversionRequest>, AxiosError>({
    queryKey: conversionKeys.list(params),
    queryFn: () => getConversionsFn(params),
    ...options,
  });

export const useUpdateConversionStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ConversionRequest>,
    AxiosError,
    { id: string; payload: UpdateConversionStatusPayload }
  >({
    mutationFn: ({ id, payload }) => updateConversionStatusFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: conversionKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
