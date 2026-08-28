import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import { assertNoScheduleConflicts } from "@/lib/scheduling/conflict-detection";
import type { ClassSession, ClassSessionInput } from "@/types/class-session";

const QUERY_KEY = "class-sessions";

export function useCourseSessions(courseId: string | undefined): UseQueryResult<ClassSession[]> {
  return useQuery({
    queryKey: [QUERY_KEY, "by-course", courseId],
    queryFn: () => db.classSessions.where("courseId").equals(courseId as string).sortBy("startAt"),
    enabled: Boolean(courseId),
  });
}

export function useTeacherSessions(teacherId: string | undefined): UseQueryResult<ClassSession[]> {
  return useQuery({
    queryKey: [QUERY_KEY, "by-teacher", teacherId],
    queryFn: () => db.classSessions.where("teacherId").equals(teacherId as string).sortBy("startAt"),
    enabled: Boolean(teacherId),
  });
}

/**
 * Tạo 1 buổi học cụ thể trong khoá học — luôn chạy qua
 * `assertNoScheduleConflicts` trước khi ghi, vì đây là "vấn đề cốt lõi" theo
 * yêu cầu: hệ thống phải tự động phát hiện và từ chối mọi xung đột lịch giữa
 * giảng viên/phòng học/học viên, kèm thông báo cụ thể ai-lúc nào-ở đâu.
 */
export function useCreateClassSession(): UseMutationResult<ClassSession, Error, ClassSessionInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassSessionInput) => {
      await assertNoScheduleConflicts({
        teacherId: input.teacherId,
        roomId: input.roomId,
        studentIds: input.studentIds,
        startAt: input.startAt,
        endAt: input.endAt,
      });

      const now = Date.now();
      const session: ClassSession = {
        ...input,
        id: crypto.randomUUID(),
        isFinished: false,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      await db.classSessions.add(session);
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "by-course", session.courseId] });
    },
  });
}

export function useUpdateClassSession(): UseMutationResult<
  ClassSession,
  Error,
  { id: string; input: ClassSessionInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }) => {
      const existing = await db.classSessions.get(id);
      if (!existing) throw new Error("Không tìm thấy buổi học.");

      await assertNoScheduleConflicts({
        teacherId: input.teacherId,
        roomId: input.roomId,
        studentIds: input.studentIds,
        startAt: input.startAt,
        endAt: input.endAt,
        excludeSessionId: id,
      });

      const updated: ClassSession = { ...existing, ...input, updatedAt: Date.now() };
      await db.classSessions.put(updated);
      return updated;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "by-course", session.courseId] });
    },
  });
}

export function useRemoveClassSession(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await db.classSessions.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useMarkSessionFinished(): UseMutationResult<ClassSession, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await db.classSessions.get(id);
      if (!existing) throw new Error("Không tìm thấy buổi học.");
      const updated: ClassSession = { ...existing, isFinished: true, updatedAt: Date.now() };
      await db.classSessions.put(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
