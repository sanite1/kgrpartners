import { api } from "../api";
import type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
} from "../types/api.types";
import type {
  Todo,
  TodoCounts,
  CreateTodoPayload,
  UpdateTodoPayload,
  TodosQueryParams,
} from "../types/todo.types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/todos";

// the list endpoint carries the per-view counts alongside the page
export type TodosResponse = PaginatedResponse<Todo> & { counts?: TodoCounts };

// RAW API FUNCTIONS

export const getTodosFn = (
  params?: TodosQueryParams,
): Promise<TodosResponse> => api.get<TodosResponse>(BASE, params);

export const createTodoFn = (
  payload: CreateTodoPayload,
): Promise<ApiResponse<Todo>> => api.post<ApiResponse<Todo>>(BASE, payload);

export const updateTodoFn = (
  id: string,
  payload: UpdateTodoPayload,
): Promise<ApiResponse<Todo>> =>
  api.patch<ApiResponse<Todo>>(`${BASE}/${id}`, payload);

export const markTodoDoneFn = (id: string): Promise<ApiResponse<Todo>> =>
  api.post<ApiResponse<Todo>>(`${BASE}/${id}/done`, {});

export const reopenTodoFn = (id: string): Promise<ApiResponse<Todo>> =>
  api.post<ApiResponse<Todo>>(`${BASE}/${id}/reopen`, {});

export const snoozeTodoFn = (
  id: string,
  days: number,
): Promise<ApiResponse<Todo>> =>
  api.post<ApiResponse<Todo>>(`${BASE}/${id}/snooze`, { days });

export const deleteTodoFn = (id: string): Promise<ApiResponse<undefined>> =>
  api.delete<ApiResponse<undefined>>(`${BASE}/${id}`);

// REACT QUERY: Query Keys

export const todoKeys = {
  all: ["todos"] as const,
  list: (params?: TodosQueryParams) =>
    [...todoKeys.all, "list", params ?? {}] as const,
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

export const useGetTodos = (
  params?: TodosQueryParams,
  options?: Partial<UseQueryOptions<TodosResponse, AxiosError>>,
) =>
  useQuery<TodosResponse, AxiosError>({
    queryKey: todoKeys.list(params),
    queryFn: () => getTodosFn(params),
    ...options,
  });

// REACT QUERY: Mutations

const useTodoMutation = <TVars, TData>(
  fn: (vars: TVars) => Promise<ApiResponse<TData>>,
) => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<TData>, AxiosError, TVars>({
    mutationFn: fn,
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: todoKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCreateTodo = () =>
  useTodoMutation<CreateTodoPayload, Todo>((payload) =>
    createTodoFn(payload),
  );

export const useUpdateTodo = () =>
  useTodoMutation<{ id: string; payload: UpdateTodoPayload }, Todo>(
    ({ id, payload }) => updateTodoFn(id, payload),
  );

export const useMarkTodoDone = () =>
  useTodoMutation<string, Todo>((id) => markTodoDoneFn(id));

export const useReopenTodo = () =>
  useTodoMutation<string, Todo>((id) => reopenTodoFn(id));

export const useSnoozeTodo = () =>
  useTodoMutation<{ id: string; days: number }, Todo>(({ id, days }) =>
    snoozeTodoFn(id, days),
  );

export const useDeleteTodo = () =>
  useTodoMutation<string, undefined>((id) => deleteTodoFn(id));
