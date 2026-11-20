import { api } from "../api";
import type { ApiResponse } from "../types/api.types";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export interface NotificationCounts {
  lowStock: number;
  pending: number;
  gatePasses: number;
}

export const getNotificationCountsFn = (): Promise<
  ApiResponse<NotificationCounts>
> => api.get<ApiResponse<NotificationCounts>>("/api/notifications/counts");

export const notificationKeys = {
  counts: ["notification-counts"] as const,
} as const;

// The bell's three numbers in one call. Every five minutes, and only
// while the tab is visible: a console left open all day on the gate
// laptop used to cost three requests a minute.
export const useGetNotificationCounts = () =>
  useQuery<ApiResponse<NotificationCounts>, AxiosError>({
    queryKey: notificationKeys.counts,
    queryFn: getNotificationCountsFn,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });
