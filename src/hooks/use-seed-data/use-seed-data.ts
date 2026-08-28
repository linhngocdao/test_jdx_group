import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearDatabase, seedDatabase } from "@/lib/db/seed";

export function useSeedDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { teacherCount?: number; studentCount?: number; roomCount?: number }) =>
      seedDatabase(params),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useClearDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
