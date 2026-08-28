import { db } from "@/lib/db/dexie-db";
import type { Course, CourseStatus } from "@/types/course";
import { COURSE_TRANSITIONS } from "@/types/course";

export class InvalidCourseTransitionError extends Error {
  constructor(from: CourseStatus, to: CourseStatus) {
    super(`Không thể chuyển khoá học từ "${from}" sang "${to}".`);
    this.name = "InvalidCourseTransitionError";
  }
}

export function assertValidTransition(from: CourseStatus, to: CourseStatus): void {
  if (!COURSE_TRANSITIONS[from].includes(to)) {
    throw new InvalidCourseTransitionError(from, to);
  }
}

export async function countConfirmedEnrollments(courseId: string): Promise<number> {
  return db.enrollments
    .where("courseId")
    .equals(courseId)
    .filter((e) => e.enrollmentStatus === "confirmed" || e.enrollmentStatus === "pending")
    .count();
}

/**
 * Tự động huỷ mọi khoá học đang "open" mà đã quá ngày khai giảng nhưng chưa
 * đạt số học viên tối thiểu — theo đúng yêu cầu "hệ thống phải xử lý đúng,
 * không cần admin can thiệp thủ công". Được gọi mỗi khi danh sách khoá học
 * được tải (lazy, không cần cron job thật vì app chạy hoàn toàn phía client).
 *
 * Trả về danh sách khoá học vừa bị tự động huỷ để UI có thể thông báo.
 */
export async function autoCancelUnderEnrolledCourses(): Promise<Course[]> {
  const now = Date.now();
  const dueOpenCourses = await db.courses
    .where("courseStatus")
    .equals("open")
    .filter((course) => course.startDate <= now)
    .toArray();

  const cancelled: Course[] = [];

  for (const course of dueOpenCourses) {
    const confirmedCount = await countConfirmedEnrollments(course.id);
    if (confirmedCount < course.minStudents) {
      const updated: Course = {
        ...course,
        courseStatus: "cancelled",
        cancelReason: `Tự động huỷ: đến ngày khai giảng chỉ có ${confirmedCount}/${course.minStudents} học viên đăng ký tối thiểu.`,
        updatedAt: now,
      };
      await db.courses.put(updated);

      // Đăng ký đang chờ/đã xác nhận của khoá học bị huỷ cũng phải tự huỷ theo.
      const relatedEnrollments = await db.enrollments
        .where("courseId")
        .equals(course.id)
        .filter((e) => e.enrollmentStatus === "pending" || e.enrollmentStatus === "confirmed")
        .toArray();

      await Promise.all(
        relatedEnrollments.map((enrollment) =>
          db.enrollments.put({
            ...enrollment,
            enrollmentStatus: "cancelled",
            cancelReason: "Khoá học bị huỷ do không đủ học viên tối thiểu.",
            updatedAt: now,
          })
        )
      );

      cancelled.push(updated);
    }
  }

  return cancelled;
}
