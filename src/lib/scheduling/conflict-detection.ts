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

export interface TimeSlot {
  startAt: number;
  endAt: number;
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
 * Tìm xung đột lịch của riêng học viên trong khoảng [startAt, endAt) — tách
 * riêng khỏi `findScheduleConflicts` vì không có index trên mảng
 * `studentIds` nên buộc phải quét bảng `classSessions`. Khi caller chỉ cần
 * biết xung đột học viên (không quan tâm giảng viên/phòng của chính session
 * đang xét — vd. kiểm tra 1 học viên có rảnh cho N session sẵn có của 1 khoá
 * học), gọi thẳng hàm này để không trả thêm chi phí lookup giảng viên/phòng
 * không dùng tới.
 */
export async function findStudentScheduleConflicts(
  studentIds: string[],
  slot: TimeSlot
): Promise<ScheduleConflict[]> {
  if (studentIds.length === 0) return [];

  const { startAt, endAt, excludeSessionId } = slot;
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

  return conflictPairs.map(({ studentId, session }, index) => {
    const student = students[index];
    return {
      subject: "student" as const,
      subjectId: studentId,
      subjectName: student?.fullName ?? "Học viên",
      conflictingSession: session,
      message: `Học viên ${student?.fullName ?? ""} đã tham gia "${
        session.courseName
      }" trùng giờ ${formatTimeRange(session.startAt, session.endAt)}.`,
    };
  });
}

/**
 * Kiểm tra xung đột lịch của 1 học viên với NHIỀU khung giờ cùng lúc (vd.
 * toàn bộ session của 1 khoá học) — quét bảng `classSessions` MỘT LẦN DUY
 * NHẤT rồi so khớp overlap với từng khung giờ trong bộ nhớ, thay vì gọi
 * `findStudentScheduleConflicts` N lần (N lần quét bảng). Dùng khi cần kiểm
 * tra "học viên này có rảnh cho toàn bộ N buổi của khoá học không?".
 */
export async function findStudentScheduleConflictsForSlots(
  studentId: string,
  slots: TimeSlot[]
): Promise<ScheduleConflict[]> {
  if (slots.length === 0) return [];

  const studentIdSet = new Set([studentId]);
  const excludeIds = new Set(slots.map((s) => s.excludeSessionId).filter(Boolean));

  const candidateSessions = await db.classSessions
    .filter(
      (session) =>
        !session.isFinished &&
        !excludeIds.has(session.id) &&
        session.studentIds.some((id) => studentIdSet.has(id))
    )
    .toArray();

  const conflictPairs = slots.flatMap((slot) =>
    candidateSessions
      .filter(
        (session) =>
          session.id !== slot.excludeSessionId &&
          timeRangesOverlap(slot.startAt, slot.endAt, session.startAt, session.endAt)
      )
      .map((session) => ({ session }))
  );

  if (conflictPairs.length === 0) return [];

  const student = await db.students.get(studentId);
  const seen = new Set<string>();
  const conflicts: ScheduleConflict[] = [];

  for (const { session } of conflictPairs) {
    if (seen.has(session.id)) continue;
    seen.add(session.id);
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

  return conflicts;
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

  const [teacherSessions, roomSessions, studentConflicts] = await Promise.all([
    findOverlappingSessionsBy("teacherId", teacherId, startAt, endAt, excludeSessionId),
    findOverlappingSessionsBy("roomId", roomId, startAt, endAt, excludeSessionId),
    findStudentScheduleConflicts(studentIds, { startAt, endAt, excludeSessionId }),
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

  conflicts.push(...studentConflicts);

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
