import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Expenditure,
  ExpenditureCategory,
  ExpenditureSummary,
  CreateExpenditurePayload,
  UpdateExpenditurePayload,
  CreateCategoryPayload,
  ExpendituresQueryParams,
  ExpenditureSummaryParams,
} from "../types/expenditure.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/expenditures";

// RAW API FUNCTIONS

export const getExpendituresFn = (
  params?: ExpendituresQueryParams,
): Promise<PaginatedResponse<Expenditure>> =>
  api.get<PaginatedResponse<Expenditure>>(BASE, params);

export const getExpenditureSummaryFn = (
  params?: ExpenditureSummaryParams,
): Promise<ApiResponse<ExpenditureSummary>> =>
  api.get<ApiResponse<ExpenditureSummary>>(`${BASE}/summary`, params);

export const getCategoriesFn = (): Promise<
  ApiResponse<ExpenditureCategory[]>
> => api.get<ApiResponse<ExpenditureCategory[]>>(`${BASE}/categories`);

export const createExpenditureFn = (
  payload: CreateExpenditurePayload,
): Promise<ApiResponse<Expenditure>> =>
  api.post<ApiResponse<Expenditure>>(BASE, payload);

export const updateExpenditureFn = (
  id: string,
  payload: UpdateExpenditurePayload,
): Promise<ApiResponse<Expenditure>> =>
  api.patch<ApiResponse<Expenditure>>(`${BASE}/${id}`, payload);

export const deleteExpenditureFn = (
  id: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

export const createCategoryFn = (
  payload: CreateCategoryPayload,
): Promise<ApiResponse<ExpenditureCategory>> =>
  api.post<ApiResponse<ExpenditureCategory>>(`${BASE}/categories`, payload);

// REACT QUERY: Query Keys

export const expenditureKeys = {
  all: ["expenditures"] as const,
  list: (params?: ExpendituresQueryParams) =>
    [...expenditureKeys.all, "list", params ?? {}] as const,
  summary: (params?: ExpenditureSummaryParams) =>
    [...expenditureKeys.all, "summary", params ?? {}] as const,
  categories: () => [...expenditureKeys.all, "categories"] as const,
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

export const useGetExpenditures = (
  params?: ExpendituresQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<Expenditure>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<Expenditure>, AxiosError>({
    queryKey: expenditureKeys.list(params),
    queryFn: () => getExpendituresFn(params),
    ...options,
  });

export const useGetExpenditureSummary = (
  params?: ExpenditureSummaryParams,
  options?: Partial<
    UseQueryOptions<ApiResponse<ExpenditureSummary>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<ExpenditureSummary>, AxiosError>({
    queryKey: expenditureKeys.summary(params),
    queryFn: () => getExpenditureSummaryFn(params),
    ...options,
  });

export const useGetExpenditureCategories = (
  options?: Partial<
    UseQueryOptions<ApiResponse<ExpenditureCategory[]>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<ExpenditureCategory[]>, AxiosError>({
    queryKey: expenditureKeys.categories(),
    queryFn: () => getCategoriesFn(),
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateExpenditure = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Expenditure>,
    AxiosError,
    CreateExpenditurePayload
  >({
    mutationFn: (payload) => createExpenditureFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: expenditureKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useUpdateExpenditure = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Expenditure>,
    AxiosError,
    { id: string; payload: UpdateExpenditurePayload }
  >({
    mutationFn: ({ id, payload }) => updateExpenditureFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: expenditureKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useDeleteExpenditure = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<undefined>, AxiosError, string>({
    mutationFn: (id) => deleteExpenditureFn(id),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: expenditureKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ExpenditureCategory>,
    AxiosError,
    CreateCategoryPayload
  >({
    mutationFn: (payload) => createCategoryFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: expenditureKeys.categories() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};
