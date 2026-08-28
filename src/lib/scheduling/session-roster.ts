import { db } from "@/lib/db/dexie-db";
import { findStudentScheduleConflictsForSlots } from "@/lib/scheduling/conflict-detection";
import type { ClassSession } from "@/types/class-session";

export interface SessionRosterSyncResult {
  addedToSessionCount: number;
  /** Buổi học không thể tự thêm học viên vào vì trùng lịch — không được im lặng bỏ qua, phải báo rõ. */
  skippedDueToConflict: { courseName: string; startAt: number; message: string }[];
}

function timeRangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Khi 1 đăng ký chuyển sang "confirmed", tự động thêm học viên vào mọi buổi
 * học CHƯA DIỄN RA (isFinished=false) của khoá học đó — đúng kỳ vọng "đăng ký
 * xong là vào học được ngay", không cần admin thêm thủ công từng buổi.
 *
 * Trước khi thêm vào MỖI buổi, luôn kiểm tra lại xung đột lịch của chính học
 * viên đó với buổi sắp thêm — nếu học viên đã có buổi khác trùng giờ (ở khoá
 * học khác), buổi đó bị BỎ QUA (không tự thêm) và được liệt kê rõ lý do, tuyệt
 * đối không gán bất chấp điều kiện.
 */
export async function autoJoinUpcomingSessions(
  studentId: string,
  courseId: string
): Promise<SessionRosterSyncResult> {
  const upcomingSessions = await db.classSessions
    .where("courseId")
    .equals(courseId)
    .filter((session) => !session.isFinished && !session.studentIds.includes(studentId))
    .toArray();

  if (upcomingSessions.length === 0) {
    return { addedToSessionCount: 0, skippedDueToConflict: [] };
  }

  const conflicts = await findStudentScheduleConflictsForSlots(
    studentId,
    upcomingSessions.map((s) => ({ startAt: s.startAt, endAt: s.endAt, excludeSessionId: s.id }))
  );

  const skippedDueToConflict: SessionRosterSyncResult["skippedDueToConflict"] = [];
  const sessionsToUpdate: ClassSession[] = [];

  for (const session of upcomingSessions) {
    const conflict = conflicts.find((c) =>
      timeRangesOverlap(
        session.startAt,
        session.endAt,
        c.conflictingSession.startAt,
        c.conflictingSession.endAt
      )
    );
    if (conflict) {
      skippedDueToConflict.push({
        courseName: session.courseName,
        startAt: session.startAt,
        message: conflict.message,
      });
    } else {
      sessionsToUpdate.push(session);
    }
  }

  if (sessionsToUpdate.length > 0) {
    await db.classSessions.bulkPut(
      sessionsToUpdate.map((session) => ({
        ...session,
        studentIds: [...session.studentIds, studentId],
        updatedAt: Date.now(),
      }))
    );
  }

  return { addedToSessionCount: sessionsToUpdate.length, skippedDueToConflict };
}

/**
 * Khi 1 đăng ký bị huỷ, loại học viên khỏi mọi buổi học CHƯA DIỄN RA của
 * khoá đó — đối xứng với auto-join, và giữ nguyên lịch sử các buổi đã qua
 * (isFinished=true) vì đó là dữ kiện đã xảy ra, không được sửa lại quá khứ.
 */
export async function autoLeaveUpcomingSessions(studentId: string, courseId: string): Promise<number> {
  const upcomingSessions = await db.classSessions
    .where("courseId")
    .equals(courseId)
    .filter((session) => !session.isFinished && session.studentIds.includes(studentId))
    .toArray();

  if (upcomingSessions.length === 0) return 0;

  await db.classSessions.bulkPut(
    upcomingSessions.map((session) => ({
      ...session,
      studentIds: session.studentIds.filter((id) => id !== studentId),
      updatedAt: Date.now(),
    }))
  );

  return upcomingSessions.length;
}
