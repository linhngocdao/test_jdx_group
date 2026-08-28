import { db } from "@/lib/db/dexie-db";
import { countConfirmedEnrollments } from "@/lib/scheduling/course-lifecycle";
import { findScheduleConflicts } from "@/lib/scheduling/conflict-detection";
import type { Course } from "@/types/course";
import type { Student } from "@/types/student";

export interface EnrollmentEligibility {
  eligible: boolean;
  reasons: string[];
}

/**
 * Kiểm tra học viên có đủ điều kiện đăng ký vào 1 khoá học hay không, theo
 * đúng yêu cầu: "hệ thống phải check khoá học nào đang nhận đăng ký, học
 * viên nào đủ điều kiện, số lượng không vượt quá sức chứa phòng và không
 * xung đột lịch". Trả về TOÀN BỘ lý do không đủ điều kiện, không dừng sớm.
 */
export async function checkEnrollmentEligibility(
  course: Course,
  student: Student
): Promise<EnrollmentEligibility> {
  const reasons: string[] = [];

  if (course.courseStatus !== "open") {
    reasons.push(`Khoá học không ở trạng thái nhận đăng ký (hiện tại: ${course.courseStatus}).`);
  }

  if (student.status === "suspended") {
    reasons.push("Học viên đang tạm ngưng hoạt động (bảo lưu), không thể đăng ký khoá học mới.");
  }

  const confirmedCount = await countConfirmedEnrollments(course.id);
  if (confirmedCount >= course.maxStudents) {
    reasons.push(
      `Khoá học đã đủ số lượng tối đa (${confirmedCount}/${course.maxStudents}), không vượt quá sức chứa phòng học.`
    );
  }

  const existingEnrollment = await db.enrollments
    .where("courseId")
    .equals(course.id)
    .filter(
      (e) =>
        e.studentId === student.id &&
        (e.enrollmentStatus === "pending" || e.enrollmentStatus === "confirmed")
    )
    .first();
  if (existingEnrollment) {
    reasons.push("Học viên đã đăng ký khoá học này rồi.");
  }

  const courseSessions = await db.classSessions.where("courseId").equals(course.id).toArray();
  for (const session of courseSessions) {
    const conflicts = await findScheduleConflicts({
      teacherId: session.teacherId,
      roomId: session.roomId,
      studentIds: [student.id],
      startAt: session.startAt,
      endAt: session.endAt,
      excludeSessionId: session.id,
    });
    const studentConflicts = conflicts.filter((c) => c.subject === "student");
    if (studentConflicts.length > 0) {
      reasons.push(...studentConflicts.map((c) => c.message));
    }
  }

  return { eligible: reasons.length === 0, reasons };
}
