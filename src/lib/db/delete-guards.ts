import { db } from "./dexie-db";
import type { Course } from "@/types/course";
import type { DeleteGuardResult } from "@/types/entity";
import type { EquipmentType } from "@/types/equipment-type";
import type { Room } from "@/types/room";
import type { Specialty } from "@/types/specialty";
import type { Student } from "@/types/student";
import type { Teacher } from "@/types/teacher";

/** Giảng viên đang được gán cho buổi học chưa kết thúc thì không được xoá. */
export async function checkTeacherDeleteGuard(teacher: Teacher): Promise<DeleteGuardResult> {
  const activeSessions = await db.classSessions
    .where("teacherId")
    .equals(teacher.id)
    .filter((session) => !session.isFinished)
    .toArray();

  if (activeSessions.length === 0) {
    return { canDelete: true, blockers: [] };
  }

  return {
    canDelete: false,
    blockers: [
      `Giảng viên đang được phân công ${activeSessions.length} buổi học chưa kết thúc (${activeSessions
        .map((s) => s.courseName)
        .join(", ")}).`,
    ],
  };
}

/** Phòng học đang được gán cho buổi học chưa kết thúc thì không được xoá. */
export async function checkRoomDeleteGuard(room: Room): Promise<DeleteGuardResult> {
  const activeSessions = await db.classSessions
    .where("roomId")
    .equals(room.id)
    .filter((session) => !session.isFinished)
    .toArray();

  if (activeSessions.length === 0) {
    return { canDelete: true, blockers: [] };
  }

  return {
    canDelete: false,
    blockers: [
      `Phòng học đang được đặt lịch cho ${activeSessions.length} buổi học chưa kết thúc.`,
    ],
  };
}

/** Học viên đang tham gia buổi học chưa kết thúc thì không được xoá. */
export async function checkStudentDeleteGuard(student: Student): Promise<DeleteGuardResult> {
  const activeSessions = await db.classSessions
    .filter(
      (session) => !session.isFinished && session.studentIds.includes(student.id)
    )
    .toArray();

  if (activeSessions.length === 0) {
    return { canDelete: true, blockers: [] };
  }

  return {
    canDelete: false,
    blockers: [
      `Học viên đang theo học ${activeSessions.length} buổi học chưa kết thúc.`,
    ],
  };
}

/** Khoá học chỉ được xoá khi ở trạng thái draft hoặc đã cancelled/finished (không còn hoạt động). */
export async function checkCourseDeleteGuard(course: Course): Promise<DeleteGuardResult> {
  if (course.courseStatus === "open" || course.courseStatus === "ongoing") {
    return {
      canDelete: false,
      blockers: [
        `Khoá học đang ở trạng thái "${course.courseStatus === "open" ? "Đang mở đăng ký" : "Đang diễn ra"}", cần huỷ khoá học trước khi xoá.`,
      ],
    };
  }
  return { canDelete: true, blockers: [] };
}

/** Chuyên môn đang được giảng viên nào dùng thì không được xoá. */
export async function checkSpecialtyDeleteGuard(specialty: Specialty): Promise<DeleteGuardResult> {
  const usedByCount = await db.teachers.where("specialtyId").equals(specialty.id).count();
  if (usedByCount === 0) {
    return { canDelete: true, blockers: [] };
  }
  return {
    canDelete: false,
    blockers: [`Chuyên môn đang được ${usedByCount} giảng viên sử dụng.`],
  };
}

/** Loại thiết bị đang được gán cho phòng học nào thì không được xoá. */
export async function checkEquipmentTypeDeleteGuard(
  equipmentType: EquipmentType
): Promise<DeleteGuardResult> {
  const usedByCount = await db.rooms
    .filter((room) => room.equipmentTypeIds.includes(equipmentType.id))
    .count();
  if (usedByCount === 0) {
    return { canDelete: true, blockers: [] };
  }
  return {
    canDelete: false,
    blockers: [`Loại thiết bị đang được gán cho ${usedByCount} phòng học.`],
  };
}
