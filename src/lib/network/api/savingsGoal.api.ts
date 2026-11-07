import { api } from "../api";
import type { ApiResponse, ApiErrorResponse } from "../types/api.types";
import type {
  SavingsGoal,
  GoalWithSummary,
  GoalDetailData,
  GoalEntry,
  CreateGoalPayload,
  UpdateGoalPayload,
  CreateGoalEntryPayload,
  UpdateGoalEntryPayload,
} from "../types/savingsGoal.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/goals";

// RAW API FUNCTIONS

export const getGoalsFn = (): Promise<ApiResponse<GoalWithSummary[]>> =>
  api.get<ApiResponse<GoalWithSummary[]>>(BASE);

export const getGoalFn = (id: string): Promise<ApiResponse<GoalDetailData>> =>
  api.get<ApiResponse<GoalDetailData>>(`${BASE}/${id}`);

export const createGoalFn = (
  payload: CreateGoalPayload,
): Promise<ApiResponse<SavingsGoal>> =>
  api.post<ApiResponse<SavingsGoal>>(BASE, payload);

export const updateGoalFn = (
  id: string,
  payload: UpdateGoalPayload,
): Promise<ApiResponse<SavingsGoal>> =>
  api.patch<ApiResponse<SavingsGoal>>(`${BASE}/${id}`, payload);

export const deleteGoalFn = (id: string): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

export const createGoalEntryFn = (
  goalId: string,
  payload: CreateGoalEntryPayload,
): Promise<ApiResponse<GoalEntry>> =>
  api.post<ApiResponse<GoalEntry>>(`${BASE}/${goalId}/entries`, payload);

export const updateGoalEntryFn = (
  goalId: string,
  entryId: string,
  payload: UpdateGoalEntryPayload,
): Promise<ApiResponse<GoalEntry>> =>
  api.patch<ApiResponse<GoalEntry>>(
    `${BASE}/${goalId}/entries/${entryId}`,
    payload,
  );

export const deleteGoalEntryFn = (
  goalId: string,
  entryId: string,
): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${goalId}/entries/${entryId}`);

// REACT QUERY: Query Keys

export const goalKeys = {
  all: ["savings-goals"] as const,
  list: () => [...goalKeys.all, "list"] as const,
  detail: (id: string) => [...goalKeys.all, "detail", id] as const,
} as const;

// Error helper

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
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

export const useGetGoals = (
  options?: Partial<
    UseQueryOptions<ApiResponse<GoalWithSummary[]>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<GoalWithSummary[]>, AxiosError>({
    queryKey: goalKeys.list(),
    queryFn: () => getGoalsFn(),
    ...options,
  });

export const useGetGoal = (
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<GoalDetailData>, AxiosError>>,
) =>
  useQuery<ApiResponse<GoalDetailData>, AxiosError>({
    queryKey: goalKeys.detail(id),
    queryFn: () => getGoalFn(id),
    enabled: !!id,
    ...options,
  });

// REACT QUERY: Mutations

const useGoalMutation = <TData extends { message: string }, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
) => {
  const qc = useQueryClient();
  return useMutation<TData, AxiosError, TVars>({
    mutationFn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: goalKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreateGoal = () =>
  useGoalMutation<ApiResponse<SavingsGoal>, CreateGoalPayload>(createGoalFn);

export const useUpdateGoal = () =>
  useGoalMutation<
    ApiResponse<SavingsGoal>,
    { id: string; payload: UpdateGoalPayload }
  >(({ id, payload }) => updateGoalFn(id, payload));

export const useDeleteGoal = () =>
  useGoalMutation<ApiResponse<undefined>, string>(deleteGoalFn);

export const useCreateGoalEntry = () =>
  useGoalMutation<
    ApiResponse<GoalEntry>,
    { goalId: string; payload: CreateGoalEntryPayload }
  >(({ goalId, payload }) => createGoalEntryFn(goalId, payload));

export const useUpdateGoalEntry = () =>
  useGoalMutation<
    ApiResponse<GoalEntry>,
    { goalId: string; entryId: string; payload: UpdateGoalEntryPayload }
  >(({ goalId, entryId, payload }) =>
    updateGoalEntryFn(goalId, entryId, payload),
  );

export const useDeleteGoalEntry = () =>
  useGoalMutation<ApiResponse<undefined>, { goalId: string; entryId: string }>(
    ({ goalId, entryId }) => deleteGoalEntryFn(goalId, entryId),
  );
