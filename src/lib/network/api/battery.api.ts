import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Battery,
  BatteryMovement,
  BatterySummaryData,
  IdleBatteriesData,
  CreateBatteryPayload,
  UpdateBatteryPayload,
  IssueBatteryPayload,
  CollectBatteryPayload,
  SetBatteryStatusPayload,
  BatteriesQueryParams,
} from "../types/battery.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/batteries";

// RAW API FUNCTIONS

export const getBatteriesFn = (
  params?: BatteriesQueryParams,
): Promise<PaginatedResponse<Battery>> =>
  api.get<PaginatedResponse<Battery>>(BASE, params);

export const getBatterySummaryFn = (): Promise<
  ApiResponse<BatterySummaryData>
> => api.get<ApiResponse<BatterySummaryData>>(`${BASE}/summary`);

export const getIdleBatteriesFn = (): Promise<ApiResponse<IdleBatteriesData>> =>
  api.get<ApiResponse<IdleBatteriesData>>(`${BASE}/idle`);

export const createBatteryFn = (
  payload: CreateBatteryPayload,
): Promise<ApiResponse<Battery>> =>
  api.post<ApiResponse<Battery>>(BASE, payload);

export const updateBatteryFn = (
  id: string,
  payload: UpdateBatteryPayload,
): Promise<ApiResponse<Battery>> =>
  api.patch<ApiResponse<Battery>>(`${BASE}/${id}`, payload);

export const issueBatteryFn = (
  id: string,
  payload: IssueBatteryPayload,
): Promise<ApiResponse<Battery>> =>
  api.post<ApiResponse<Battery>>(`${BASE}/${id}/issue`, payload);

export const collectBatteryFn = (
  id: string,
  payload: CollectBatteryPayload,
): Promise<ApiResponse<Battery>> =>
  api.post<ApiResponse<Battery>>(`${BASE}/${id}/collect`, payload);

export const setBatteryStatusFn = (
  id: string,
  payload: SetBatteryStatusPayload,
): Promise<ApiResponse<Battery>> =>
  api.post<ApiResponse<Battery>>(`${BASE}/${id}/status`, payload);

export const snoozeBatteryFn = (
  id: string,
  days: number,
): Promise<ApiResponse<Battery>> =>
  api.post<ApiResponse<Battery>>(`${BASE}/${id}/snooze`, { days });

export const getBatteryMovementsFn = (
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResponse<BatteryMovement>> =>
  api.get<PaginatedResponse<BatteryMovement>>(
    `${BASE}/${id}/movements`,
    params,
  );

// REACT QUERY: Query Keys

export const batteryKeys = {
  all: ["batteries"] as const,
  list: (params?: BatteriesQueryParams) =>
    [...batteryKeys.all, "list", params ?? {}] as const,
  summary: () => [...batteryKeys.all, "summary"] as const,
  idle: () => [...batteryKeys.all, "idle"] as const,
  movements: (id: string, page?: number) =>
    [...batteryKeys.all, "movements", id, page ?? 1] as const,
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

export const useGetBatteries = (
  params?: BatteriesQueryParams,
  options?: Partial<UseQueryOptions<PaginatedResponse<Battery>, AxiosError>>,
) =>
  useQuery<PaginatedResponse<Battery>, AxiosError>({
    queryKey: batteryKeys.list(params),
    queryFn: () => getBatteriesFn(params),
    ...options,
  });

export const useGetBatterySummary = (
  options?: Partial<
    UseQueryOptions<ApiResponse<BatterySummaryData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<BatterySummaryData>, AxiosError>({
    queryKey: batteryKeys.summary(),
    queryFn: () => getBatterySummaryFn(),
    ...options,
  });

export const useGetIdleBatteries = (
  options?: Partial<UseQueryOptions<ApiResponse<IdleBatteriesData>, AxiosError>>,
) =>
  useQuery<ApiResponse<IdleBatteriesData>, AxiosError>({
    queryKey: batteryKeys.idle(),
    queryFn: () => getIdleBatteriesFn(),
    ...options,
  });

export const useGetBatteryMovements = (
  id: string,
  page?: number,
  options?: Partial<
    UseQueryOptions<PaginatedResponse<BatteryMovement>, AxiosError>
  >,
) =>
  useQuery<PaginatedResponse<BatteryMovement>, AxiosError>({
    queryKey: batteryKeys.movements(id, page),
    queryFn: () => getBatteryMovementsFn(id, { page, pageSize: 20 }),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations

export const useCreateBattery = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Battery>, AxiosError, CreateBatteryPayload>({
    mutationFn: (payload) => createBatteryFn(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: batteryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateBattery = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Battery>,
    AxiosError,
    { id: string; payload: UpdateBatteryPayload }
  >({
    mutationFn: ({ id, payload }) => updateBatteryFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: batteryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useIssueBattery = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Battery>,
    AxiosError,
    { id: string; payload: IssueBatteryPayload }
  >({
    mutationFn: ({ id, payload }) => issueBatteryFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: batteryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCollectBattery = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Battery>,
    AxiosError,
    { id: string; payload: CollectBatteryPayload }
  >({
    mutationFn: ({ id, payload }) => collectBatteryFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: batteryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useSnoozeBattery = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Battery>, AxiosError, { id: string; days: number }>({
    mutationFn: ({ id, days }) => snoozeBatteryFn(id, days),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: batteryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useSetBatteryStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Battery>,
    AxiosError,
    { id: string; payload: SetBatteryStatusPayload }
  >({
    mutationFn: ({ id, payload }) => setBatteryStatusFn(id, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: batteryKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
