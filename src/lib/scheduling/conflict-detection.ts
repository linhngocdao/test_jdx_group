import { db } from "@/lib/db/dexie-db";
import type { ClassSession } from "@/types/class-session";

export type ScheduleConflictSubject = "teacher" | "room" | "student";

export interface ScheduleConflict {
  subject: ScheduleConflictSubject;
  subjectId: string;
  subjectName: string;
  /** Buổi học đang tồn tại mà gây xung đột. */
  conflictingSession: ClassSession;
  message: string;
}

export interface CandidateSession {
  teacherId: string;
  roomId: string;
  studentIds: string[];
  startAt: number;
  endAt: number;
  /** Bỏ qua session này khi kiểm tra — dùng khi sửa lại 1 buổi học đã có. */
  excludeSessionId?: string;
}

function timeRangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function formatTimeRange(startAt: number, endAt: number): string {
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateFormatter.format(startAt)} (${timeFormatter.format(startAt)}-${timeFormatter.format(endAt)})`;
}

/**
 * Core dùng chung để phát hiện xung đột lịch — được gọi cả khi tạo/sửa buổi
 * học trong 1 khoá học (module Khoá học & Lịch dạy) lẫn khi xác nhận đăng ký
 * học viên (module Đăng ký học viên), để không có 2 cài đặt logic khác nhau
 * dẫn tới lệch kết quả.
 *
 * Trả về TOÀN BỘ xung đột tìm thấy (không dừng ở lỗi đầu tiên) để thông báo
 * đầy đủ cho người dùng biết xung đột xảy ra với ai, lúc nào, ở đâu.
 */
export async function findScheduleConflicts(
  candidate: CandidateSession
): Promise<ScheduleConflict[]> {
  const { teacherId, roomId, studentIds, startAt, endAt, excludeSessionId } = candidate;

  const activeSessions = await db.classSessions
    .filter((session) => !session.isFinished && session.id !== excludeSessionId)
    .filter((session) => timeRangesOverlap(startAt, endAt, session.startAt, session.endAt))
    .toArray();

  const conflicts: ScheduleConflict[] = [];

  const teacherConflictSession = activeSessions.find((s) => s.teacherId === teacherId);
  if (teacherConflictSession) {
    const teacher = await db.teachers.get(teacherId);
    conflicts.push({
      subject: "teacher",
      subjectId: teacherId,
      subjectName: teacher?.fullName ?? "Giảng viên",
      conflictingSession: teacherConflictSession,
      message: `Giảng viên ${teacher?.fullName ?? ""} đã có lịch dạy "${
        teacherConflictSession.courseName
      }" trùng giờ ${formatTimeRange(teacherConflictSession.startAt, teacherConflictSession.endAt)}.`,
    });
  }

  const roomConflictSession = activeSessions.find((s) => s.roomId === roomId);
  if (roomConflictSession) {
    const room = await db.rooms.get(roomId);
    conflicts.push({
      subject: "room",
      subjectId: roomId,
      subjectName: room?.name ?? "Phòng học",
      conflictingSession: roomConflictSession,
      message: `Phòng ${room?.name ?? ""} đã được đặt cho "${
        roomConflictSession.courseName
      }" trùng giờ ${formatTimeRange(roomConflictSession.startAt, roomConflictSession.endAt)}.`,
    });
  }

  if (studentIds.length > 0) {
    const studentIdSet = new Set(studentIds);
    for (const session of activeSessions) {
      const overlappingStudentIds = session.studentIds.filter((id) => studentIdSet.has(id));
      for (const studentId of overlappingStudentIds) {
        const student = await db.students.get(studentId);
        conflicts.push({
          subject: "student",
          subjectId: studentId,
          subjectName: student?.fullName ?? "Học viên",
          conflictingSession: session,
          message: `Học viên ${student?.fullName ?? ""} đã tham gia "${
            session.courseName
          }" trùng giờ ${formatTimeRange(session.startAt, session.endAt)}.`,
        });
      }
    }
  }

  return conflicts;
}

/** Ném ra khi phát hiện xung đột — UI bắt lỗi này để liệt kê rõ từng xung đột cho người dùng. */
export class ScheduleConflictError extends Error {
  conflicts: ScheduleConflict[];

  constructor(conflicts: ScheduleConflict[]) {
    super(conflicts.map((c) => c.message).join(" "));
    this.name = "ScheduleConflictError";
    this.conflicts = conflicts;
  }
}

export async function assertNoScheduleConflicts(candidate: CandidateSession): Promise<void> {
  const conflicts = await findScheduleConflicts(candidate);
  if (conflicts.length > 0) {
    throw new ScheduleConflictError(conflicts);
  }
}
