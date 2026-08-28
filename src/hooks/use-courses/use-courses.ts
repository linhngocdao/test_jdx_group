import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { checkCourseDeleteGuard } from "@/lib/db/delete-guards";
import { db } from "@/lib/db/dexie-db";
import { queryPaginatedTable } from "@/lib/db/list-query";
import {
  assertValidTransition,
  autoCancelUnderEnrolledCourses,
  countConfirmedEnrollments,
} from "@/lib/scheduling/course-lifecycle";
import type { ListQueryParams, PaginatedResult } from "@/types/entity";
import type { Course, CourseInput, CourseStatus } from "@/types/course";

import { DeleteGuardError } from "@/hooks/use-crud-query";

const QUERY_KEY = "courses";

/**
 * Danh sách khoá học luôn chạy `autoCancelUnderEnrolledCourses` trước khi
 * query — đúng yêu cầu "hệ thống phải tự xử lý khi đến ngày khai giảng mà
 * chưa đủ học viên tối thiểu, không cần admin can thiệp thủ công". Vì app
 * không có cron job thật (client-only), việc này chạy lazy mỗi lần danh
 * sách được tải/refetch.
 */
export function useCourseList(params: ListQueryParams): UseQueryResult<PaginatedResult<Course>> {
  return useQuery({
    queryKey: [QUERY_KEY, "list", params],
    queryFn: async () => {
      await autoCancelUnderEnrolledCourses();
      return queryPaginatedTable(db.courses, params, { searchableFields: ["name"] });
    },
    placeholderData: (previous) => previous,
  });
}

export function useCourse(id: string | undefined): UseQueryResult<Course | undefined> {
  return useQuery({
    queryKey: [QUERY_KEY, "detail", id],
    queryFn: () => db.courses.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCourseEnrollmentCount(courseId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, "enrollment-count", courseId],
    queryFn: () => countConfirmedEnrollments(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useCreateCourse(): UseMutationResult<Course, Error, CourseInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CourseInput) => {
      const now = Date.now();
      const course: Course = {
        ...input,
        id: crypto.randomUUID(),
        courseStatus: "draft",
        createdAt: now,
        updatedAt: now,
      };
      await db.courses.add(course);
      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateCourse(): UseMutationResult<
  Course,
  Error,
  { id: string; input: CourseInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }) => {
      const existing = await db.courses.get(id);
      if (!existing) throw new Error("Không tìm thấy khoá học để cập nhật.");
      const updated: Course = { ...existing, ...input, updatedAt: Date.now() };
      await db.courses.put(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.setQueryData([QUERY_KEY, "detail", updated.id], updated);
    },
  });
}

export function useRemoveCourse(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const course = await db.courses.get(id);
      if (course) {
        const guard = await checkCourseDeleteGuard(course);
        if (!guard.canDelete) throw new DeleteGuardError(guard);
      }
      await db.courses.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Chuyển trạng thái khoá học theo đúng luật vòng đời (draft->open->ongoing->finished, hoặc ->cancelled). */
export function useTransitionCourseStatus(): UseMutationResult<
  Course,
  Error,
  { id: string; to: CourseStatus; cancelReason?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, to, cancelReason }) => {
      const existing = await db.courses.get(id);
      if (!existing) throw new Error("Không tìm thấy khoá học.");
      assertValidTransition(existing.courseStatus, to);

      const updated: Course = {
        ...existing,
        courseStatus: to,
        cancelReason: to === "cancelled" ? cancelReason : undefined,
        updatedAt: Date.now(),
      };
      await db.courses.put(updated);

      // Huỷ khoá học chủ động cũng phải huỷ theo các đăng ký chưa hoàn thành.
      if (to === "cancelled") {
        const relatedEnrollments = await db.enrollments
          .where("courseId")
          .equals(id)
          .filter((e) => e.enrollmentStatus === "pending" || e.enrollmentStatus === "confirmed")
          .toArray();
        await Promise.all(
          relatedEnrollments.map((enrollment) =>
            db.enrollments.put({
              ...enrollment,
              enrollmentStatus: "cancelled",
              cancelReason: "Khoá học đã bị huỷ.",
              updatedAt: Date.now(),
            })
          )
        );
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
