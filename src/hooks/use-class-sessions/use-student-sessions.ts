import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import type { ClassSession } from "@/types/class-session";

/** Toàn bộ buổi học mà 1 học viên tham gia (theo mọi khoá học) — dùng cho trang chi tiết học viên. */
export function useStudentSessions(studentId: string | undefined) {
  return useQuery({
    queryKey: ["class-sessions", "by-student", studentId],
    queryFn: async (): Promise<ClassSession[]> => {
      const sessions = await db.classSessions
        .filter((s) => s.studentIds.includes(studentId as string))
        .sortBy("startAt");
      return sessions;
    },
    enabled: Boolean(studentId),
  });
}
