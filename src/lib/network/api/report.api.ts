import { api } from "../api";
import type { ApiResponse } from "../types/api.types";
import type {
  MonthlyReportData,
  ExpenseReportData,
} from "../types/report.types";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

const BASE = "/api/reports";

// RAW API FUNCTIONS

export const getMonthlyReportFn = (
  month?: string,
): Promise<ApiResponse<MonthlyReportData>> =>
  api.get<ApiResponse<MonthlyReportData>>(`${BASE}/monthly`, { month });

export const getExpenseReportFn = (params?: {
  from?: string;
  to?: string;
}): Promise<ApiResponse<ExpenseReportData>> =>
  api.get<ApiResponse<ExpenseReportData>>(`${BASE}/expenses`, params);

// REACT QUERY: Query Keys

export const reportKeys = {
  all: ["reports"] as const,
  monthly: (month?: string) => [...reportKeys.all, "monthly", month] as const,
  expenses: (params?: { from?: string; to?: string }) =>
    [...reportKeys.all, "expenses", params ?? {}] as const,
} as const;

// REACT QUERY: Queries

export const useGetMonthlyReport = (
  month?: string,
  options?: Partial<
    UseQueryOptions<ApiResponse<MonthlyReportData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<MonthlyReportData>, AxiosError>({
    queryKey: reportKeys.monthly(month),
    queryFn: () => getMonthlyReportFn(month),
    ...options,
  });

export const useGetExpenseReport = (
  params?: { from?: string; to?: string },
  options?: Partial<
    UseQueryOptions<ApiResponse<ExpenseReportData>, AxiosError>
  >,
) =>
  useQuery<ApiResponse<ExpenseReportData>, AxiosError>({
    queryKey: reportKeys.expenses(params),
    queryFn: () => getExpenseReportFn(params),
    ...options,
  });
