import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  BatteryExitForm,
  FleetRosterData,
  CreateExitFormPayload,
  ExitFormsQueryParams,
} from "../types/batteryExitForm.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/battery-forms";

// RAW API FUNCTIONS

export const getFleetRosterFn = (): Promise<ApiResponse<FleetRosterData>> =>
  api.get<ApiResponse<FleetRosterData>>(`${BASE}/roster`);

export const createExitFormFn = (
  payload: CreateExitFormPayload,
): Promise<ApiResponse<BatteryExitForm>> =>
  api.post<ApiResponse<BatteryExitForm>>(BASE, payload);

export const getExitFormsFn = (
  params?: ExitFormsQueryParams,
): Promise<PaginatedResponse<BatteryExitForm>> =>
  api.get<PaginatedResponse<BatteryExitForm>>(BASE, params);

export const getExitFormFn = (
  id: string,
): Promise<ApiResponse<BatteryExitForm>> =>
  api.get<ApiResponse<BatteryExitForm>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const exitFormKeys = {
  all: ["battery-forms"] as const,
  roster: () => [...exitFormKeys.all, "roster"] as const,
  list: (params?: ExitFormsQueryParams) =>
    [...exitFormKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...exitFormKeys.all, "detail", id] as const,
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

export const useGetFleetRoster = (
  options?: Partial<UseQueryOptions<ApiResponse<FleetRosterData>, AxiosError>>,
) =>
  useQuery<ApiResponse<FleetRosterData>, AxiosError>({
    queryKey: exitFormKeys.roster(),
    queryFn: () => getFleetRosterFn(),
    ...options,
  });

export const useGetExitForms = (
  params?: ExitFormsQueryParams,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<BatteryExitForm>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<BatteryExitForm>, AxiosError>({
    queryKey: exitFormKeys.list(params),
    queryFn: () => getExitFormsFn(params),
    ...options,
  });

export const useGetExitForm = (
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<BatteryExitForm>, AxiosError>>,
) =>
  useQuery<ApiResponse<BatteryExitForm>, AxiosError>({
    queryKey: exitFormKeys.detail(id),
    queryFn: () => getExitFormFn(id),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations
// Submitting a roll-call rewrites every pack's state, so batteries
// are invalidated alongside the form list.

export const useCreateExitForm = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<BatteryExitForm>,
    AxiosError,
    CreateExitFormPayload
  >({
    mutationFn: (payload) => createExitFormFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: exitFormKeys.all });
      qc.invalidateQueries({ queryKey: ["batteries"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
