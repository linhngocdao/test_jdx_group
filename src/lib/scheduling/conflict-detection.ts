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

/** Lọc các session của 1 subject (giảng viên/phòng) còn hoạt động và trùng giờ với khoảng [startAt, endAt). */
async function findOverlappingSessionsBy(
  field: "teacherId" | "roomId",
  subjectId: string,
  startAt: number,
  endAt: number,
  excludeSessionId?: string
): Promise<ClassSession[]> {
  return db.classSessions
    .where(field)
    .equals(subjectId)
    .filter(
      (session) =>
        !session.isFinished &&
        session.id !== excludeSessionId &&
        timeRangesOverlap(startAt, endAt, session.startAt, session.endAt)
    )
    .toArray();
}

/**
 * Core dùng chung để phát hiện xung đột lịch — được gọi cả khi tạo/sửa buổi
 * học trong 1 khoá học (module Khoá học & Lịch dạy) lẫn khi xác nhận đăng ký
 * học viên (module Đăng ký học viên), để không có 2 cài đặt logic khác nhau
 * dẫn tới lệch kết quả.
 *
 * Trả về TOÀN BỘ xung đột tìm thấy (không dừng ở lỗi đầu tiên) để thông báo
 * đầy đủ cho người dùng biết xung đột xảy ra với ai, lúc nào, ở đâu.
 *
 * Dùng index Dexie (`teacherId`, `roomId`) để chỉ quét các session của đúng
 * giảng viên/phòng đó thay vì quét toàn bảng `classSessions` — với hàng
 * nghìn session, đây là khác biệt giữa 1 lookup theo index và 1 full scan.
 */
export async function findScheduleConflicts(
  candidate: CandidateSession
): Promise<ScheduleConflict[]> {
  const { teacherId, roomId, studentIds, startAt, endAt, excludeSessionId } = candidate;

  const [teacherSessions, roomSessions] = await Promise.all([
    findOverlappingSessionsBy("teacherId", teacherId, startAt, endAt, excludeSessionId),
    findOverlappingSessionsBy("roomId", roomId, startAt, endAt, excludeSessionId),
  ]);

  const conflicts: ScheduleConflict[] = [];

  const teacherConflictSession = teacherSessions[0];
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

  const roomConflictSession = roomSessions[0];
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
    // Xung đột học viên có thể xảy ra ở bất kỳ session nào (không chỉ của
    // giảng viên/phòng này) — không có index trên mảng studentIds nên đây
    // vẫn cần quét theo khoảng giờ, nhưng gom lookup học viên thành 1
    // bulkGet thay vì awaited get() từng cái trong vòng lặp.
    const studentIdSet = new Set(studentIds);
    const overlappingSessions = await db.classSessions
      .filter(
        (session) =>
          !session.isFinished &&
          session.id !== excludeSessionId &&
          timeRangesOverlap(startAt, endAt, session.startAt, session.endAt) &&
          session.studentIds.some((id) => studentIdSet.has(id))
      )
      .toArray();

    const conflictPairs = overlappingSessions.flatMap((session) =>
      session.studentIds
        .filter((id) => studentIdSet.has(id))
        .map((studentId) => ({ studentId, session }))
    );

    const students = await db.students.bulkGet(conflictPairs.map((p) => p.studentId));

    conflictPairs.forEach(({ studentId, session }, index) => {
      const student = students[index];
      conflicts.push({
        subject: "student",
        subjectId: studentId,
        subjectName: student?.fullName ?? "Học viên",
        conflictingSession: session,
        message: `Học viên ${student?.fullName ?? ""} đã tham gia "${
          session.courseName
        }" trùng giờ ${formatTimeRange(session.startAt, session.endAt)}.`,
      });
    });
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
