import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  PartnershipRequest,
  SubmitPartnershipPayload,
  UpdatePartnershipStatusPayload,
  PartnershipsQueryParams,
} from "../types/partnership.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/partnerships";

// RAW API FUNCTIONS

export const submitPartnershipFn = (
  payload: SubmitPartnershipPayload,
): Promise<ApiResponse<{ id: string; requestId: number }>> =>
  api.post<ApiResponse<{ id: string; requestId: number }>>(BASE, payload);

export const getPartnershipsFn = (
  params?: PartnershipsQueryParams,
): Promise<PaginatedResponse<PartnershipRequest>> =>
  api.get<PaginatedResponse<PartnershipRequest>>(BASE, params);

export const updatePartnershipStatusFn = (
  id: string,
  payload: UpdatePartnershipStatusPayload,
): Promise<ApiResponse<PartnershipRequest>> =>
  api.patch<ApiResponse<PartnershipRequest>>(`${BASE}/${id}/status`, payload);

// REACT QUERY: Query Keys

export const partnershipKeys = {
  all: ["partnerships"] as const,
  list: (params?: PartnershipsQueryParams) =>
    [...partnershipKeys.all, "list", params ?? {}] as const,
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

// REACT QUERY: public submit mutation (no toast: the form handles errors)

export const useSubmitPartnership = () =>
  useMutation<
    ApiResponse<{ id: string; requestId: number }>,
    AxiosError<ApiErrorResponse>,
    SubmitPartnershipPayload
  >({
    mutationFn: (payload) => submitPartnershipFn(payload),
    onError: (error) => {
      const data = error.response?.data;
      if (error.response?.status === 400 && data?.fields?.length) return;
      toast.error(getErrorMessage(error));
    },
  });

// REACT QUERY: console queries and mutations

export const useGetPartnerships = (
  params?: PartnershipsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<PartnershipRequest>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<PartnershipRequest>, AxiosError>({
    queryKey: partnershipKeys.list(params),
    queryFn: () => getPartnershipsFn(params),
    ...options,
  });

export const useUpdatePartnershipStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PartnershipRequest>,
    AxiosError,
    { id: string; payload: UpdatePartnershipStatusPayload }
  >({
    mutationFn: ({ id, payload }) => updatePartnershipStatusFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: partnershipKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
