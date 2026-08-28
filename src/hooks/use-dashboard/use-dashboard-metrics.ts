import { useQuery } from "@tanstack/react-query";

import { computeDashboardMetrics } from "@/lib/scheduling/dashboard-metrics";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: computeDashboardMetrics,
    refetchInterval: 60_000,
  });
}
