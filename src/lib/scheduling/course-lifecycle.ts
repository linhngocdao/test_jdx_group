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
 * Đếm số đăng ký "confirmed"/"pending" cho NHIỀU khoá học cùng lúc bằng 1
 * lần quét bảng `enrollments` — dùng khi cần đếm cho N khoá học (danh sách
 * khoá học, dashboard) thay vì gọi `countConfirmedEnrollments` N lần (N lần
 * quét/filter riêng biệt).
 */
export async function countConfirmedEnrollmentsBulk(
  courseIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(courseIds.map((id) => [id, 0]));
  if (courseIds.length === 0) return counts;

  const courseIdSet = new Set(courseIds);
  await db.enrollments
    .where("courseId")
    .anyOf(courseIds)
    .filter((e) => e.enrollmentStatus === "confirmed" || e.enrollmentStatus === "pending")
    .each((e) => {
      if (courseIdSet.has(e.courseId)) {
        counts.set(e.courseId, (counts.get(e.courseId) ?? 0) + 1);
      }
    });

  return counts;
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

  if (dueOpenCourses.length === 0) return [];

  // 1 lần quét enrollments cho toàn bộ khoá học due, thay vì N lần count() riêng.
  const confirmedCounts = await countConfirmedEnrollmentsBulk(dueOpenCourses.map((c) => c.id));

  const toCancel = dueOpenCourses.filter(
    (course) => (confirmedCounts.get(course.id) ?? 0) < course.minStudents
  );
  if (toCancel.length === 0) return [];

  const cancelled: Course[] = toCancel.map((course) => ({
    ...course,
    courseStatus: "cancelled",
    cancelReason: `Tự động huỷ: đến ngày khai giảng chỉ có ${
      confirmedCounts.get(course.id) ?? 0
    }/${course.minStudents} học viên đăng ký tối thiểu.`,
    updatedAt: now,
  }));

  // Đăng ký đang chờ/đã xác nhận của các khoá học bị huỷ cũng phải tự huỷ theo — 1 lần quét thay vì N lần.
  const cancelledIds = new Set(cancelled.map((c) => c.id));
  const relatedEnrollments = await db.enrollments
    .where("courseId")
    .anyOf([...cancelledIds])
    .filter((e) => e.enrollmentStatus === "pending" || e.enrollmentStatus === "confirmed")
    .toArray();

  await db.transaction("rw", db.courses, db.enrollments, async () => {
    await db.courses.bulkPut(cancelled);
    await db.enrollments.bulkPut(
      relatedEnrollments.map((enrollment) => ({
        ...enrollment,
        enrollmentStatus: "cancelled" as const,
        cancelReason: "Khoá học bị huỷ do không đủ học viên tối thiểu.",
        updatedAt: now,
      }))
    );
  });

  return cancelled;
}
