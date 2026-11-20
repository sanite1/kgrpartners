import { MutationCache, QueryClient } from "@tanstack/react-query";
import { NOTIFICATIONS_ENABLED } from "../notificationsFlag";

// Any successful change (an approval, a stock move, a gate pass) may
// move the bell's numbers, so refresh them right away instead of
// waiting for the five-minute poll. One small call per change.
const mutationCache = new MutationCache({
  onSuccess: () => {
    if (!NOTIFICATIONS_ENABLED) return;
    void queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
