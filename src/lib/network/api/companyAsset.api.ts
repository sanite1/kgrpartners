import { api } from "../api";
import type { ApiResponse, ApiErrorResponse } from "../types/api.types";
import type {
  CompanyAsset,
  CompanyAssetsData,
  CreateCompanyAssetPayload,
  UpdateCompanyAssetPayload,
} from "../types/companyAsset.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/assets";

// RAW API FUNCTIONS

export const getCompanyAssetsFn = (): Promise<ApiResponse<CompanyAssetsData>> =>
  api.get<ApiResponse<CompanyAssetsData>>(BASE);

export const createCompanyAssetFn = (
  payload: CreateCompanyAssetPayload,
): Promise<ApiResponse<CompanyAsset>> =>
  api.post<ApiResponse<CompanyAsset>>(BASE, payload);

export const updateCompanyAssetFn = (
  id: string,
  payload: UpdateCompanyAssetPayload,
): Promise<ApiResponse<CompanyAsset>> =>
  api.patch<ApiResponse<CompanyAsset>>(`${BASE}/${id}`, payload);

export const deleteCompanyAssetFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const companyAssetKeys = {
  all: ["company-assets"] as const,
  list: () => [...companyAssetKeys.all, "list"] as const,
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

export const useGetCompanyAssets = (
  options?: Partial<UseQueryOptions<ApiResponse<CompanyAssetsData>, AxiosError>>,
) =>
  useQuery<ApiResponse<CompanyAssetsData>, AxiosError>({
    queryKey: companyAssetKeys.list(),
    queryFn: () => getCompanyAssetsFn(),
    ...options,
  });

// REACT QUERY: Mutations

const useAssetMutation = <TData extends { message: string }, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
) => {
  const qc = useQueryClient();
  return useMutation<TData, AxiosError, TVars>({
    mutationFn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: companyAssetKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreateCompanyAsset = () =>
  useAssetMutation<ApiResponse<CompanyAsset>, CreateCompanyAssetPayload>(
    createCompanyAssetFn,
  );

export const useUpdateCompanyAsset = () =>
  useAssetMutation<
    ApiResponse<CompanyAsset>,
    { id: string; payload: UpdateCompanyAssetPayload }
  >(({ id, payload }) => updateCompanyAssetFn(id, payload));

export const useDeleteCompanyAsset = () =>
  useAssetMutation<ApiResponse<undefined>, string>(deleteCompanyAssetFn);
