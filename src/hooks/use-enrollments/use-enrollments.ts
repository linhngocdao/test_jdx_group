import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import { checkEnrollmentEligibility } from "@/lib/scheduling/enrollment-rules";
import type { Enrollment, EnrollmentInput, EnrollmentStatus } from "@/types/enrollment";

const QUERY_KEY = "enrollments";

export interface EnrollmentWithNames extends Enrollment {
  studentName: string;
  studentEmail: string;
}

export function useCourseEnrollments(
  courseId: string | undefined
): UseQueryResult<EnrollmentWithNames[]> {
  return useQuery({
    queryKey: [QUERY_KEY, "by-course", courseId],
    queryFn: async () => {
      const enrollments = await db.enrollments.where("courseId").equals(courseId as string).toArray();
      const students = await db.students.bulkGet(enrollments.map((e) => e.studentId));
      return enrollments.map((enrollment, index) => ({
        ...enrollment,
        studentName: students[index]?.fullName ?? "(Học viên đã xoá)",
        studentEmail: students[index]?.email ?? "",
      }));
    },
    enabled: Boolean(courseId),
  });
}

export function useStudentEnrollments(studentId: string | undefined): UseQueryResult<Enrollment[]> {
  return useQuery({
    queryKey: [QUERY_KEY, "by-student", studentId],
    queryFn: () => db.enrollments.where("studentId").equals(studentId as string).toArray(),
    enabled: Boolean(studentId),
  });
}

/**
 * Đăng ký học viên vào khoá học — chạy `checkEnrollmentEligibility` trước
 * (đúng khoá đang mở, học viên không bị tạm ngưng, còn chỗ theo sức chứa
 * phòng, không trùng lịch) rồi mới ghi. Bắt đầu ở trạng thái "pending" theo
 * đúng vòng đời đăng ký ("một đăng ký có thể ở nhiều trạng thái khác nhau").
 */
export function useCreateEnrollment(): UseMutationResult<Enrollment, Error, EnrollmentInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnrollmentInput) => {
      const [course, student] = await Promise.all([
        db.courses.get(input.courseId),
        db.students.get(input.studentId),
      ]);
      if (!course) throw new Error("Không tìm thấy khoá học.");
      if (!student) throw new Error("Không tìm thấy học viên.");

      const eligibility = await checkEnrollmentEligibility(course, student);
      if (!eligibility.eligible) {
        throw new EnrollmentEligibilityError(eligibility.reasons);
      }

      const now = Date.now();
      const enrollment: Enrollment = {
        ...input,
        id: crypto.randomUUID(),
        enrollmentStatus: "pending",
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      await db.enrollments.add(enrollment);
      return enrollment;
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["courses", "enrollment-count", enrollment.courseId] });
    },
  });
}

export function useTransitionEnrollmentStatus(): UseMutationResult<
  Enrollment,
  Error,
  { id: string; to: EnrollmentStatus; cancelReason?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, to, cancelReason }) => {
      const existing = await db.enrollments.get(id);
      if (!existing) throw new Error("Không tìm thấy đăng ký.");
      const updated: Enrollment = {
        ...existing,
        enrollmentStatus: to,
        cancelReason: to === "cancelled" ? cancelReason : undefined,
        updatedAt: Date.now(),
      };
      await db.enrollments.put(updated);
      return updated;
    },
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["courses", "enrollment-count", enrollment.courseId] });
    },
  });
}

export class EnrollmentEligibilityError extends Error {
  reasons: string[];

  constructor(reasons: string[]) {
    super(reasons.join(" "));
    this.name = "EnrollmentEligibilityError";
    this.reasons = reasons;
  }
}
