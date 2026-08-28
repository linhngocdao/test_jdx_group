import Dexie, { type EntityTable } from "dexie";

import type { ClassSession } from "@/types/class-session";
import type { Course } from "@/types/course";
import type { Enrollment } from "@/types/enrollment";
import type { EquipmentType } from "@/types/equipment-type";
import type { Room } from "@/types/room";
import type { Specialty } from "@/types/specialty";
import type { Student } from "@/types/student";
import type { Teacher } from "@/types/teacher";

/**
 * Toàn bộ dữ liệu của app sống trong IndexedDB — không có backend/API,
 * mọi CRUD đều đọc/ghi trực tiếp qua Dexie rồi chạy qua React Query để có
 * cache, invalidation, retry giống một app thật.
 */
export class AppDatabase extends Dexie {
  teachers!: EntityTable<Teacher, "id">;
  students!: EntityTable<Student, "id">;
  rooms!: EntityTable<Room, "id">;
  courses!: EntityTable<Course, "id">;
  classSessions!: EntityTable<ClassSession, "id">;
  enrollments!: EntityTable<Enrollment, "id">;
  specialties!: EntityTable<Specialty, "id">;
  equipmentTypes!: EntityTable<EquipmentType, "id">;

  constructor() {
    super("training-center-db");

    this.version(1).stores({
      teachers: "id, fullName, email, specialty, status, createdAt",
      students: "id, fullName, email, status, createdAt",
      rooms: "id, name, building, status, createdAt",
      classSessions: "id, teacherId, roomId, isFinished, startAt",
    });

    this.version(2).stores({
      teachers: "id, fullName, email, specialty, status, createdAt",
      students: "id, fullName, email, status, createdAt",
      rooms: "id, name, building, status, createdAt",
      courses: "id, name, teacherId, roomId, courseStatus, startDate, createdAt",
      classSessions: "id, courseId, teacherId, roomId, isFinished, startAt",
      enrollments: "id, studentId, courseId, enrollmentStatus, createdAt",
    });

    // v3: Chuyên môn giảng viên và thiết bị phòng học chuyển từ literal union
    // cố định trong code sang danh mục quản lý được (CRUD trong trang Cài
    // đặt) — teachers.specialty đổi thành specialtyId, rooms.equipment đổi
    // thành equipmentTypeIds.
    this.version(3)
      .stores({
        teachers: "id, fullName, email, specialtyId, status, createdAt",
        students: "id, fullName, email, status, createdAt",
        rooms: "id, name, building, status, createdAt",
        courses: "id, name, teacherId, roomId, courseStatus, startDate, createdAt",
        classSessions: "id, courseId, teacherId, roomId, isFinished, startAt",
        enrollments: "id, studentId, courseId, enrollmentStatus, createdAt",
        specialties: "id, name, status, createdAt",
        equipmentTypes: "id, name, status, createdAt",
      })
      .upgrade(async (tx) => {
        // Dữ liệu cũ (nếu có) không map được 1-1 sang id danh mục mới — xoá
        // sạch 2 bảng bị đổi cấu trúc để tránh giữ field rác, người dùng bấm
        // lại "Sinh dữ liệu mẫu" để có dữ liệu đúng schema mới.
        await tx.table("teachers").clear();
        await tx.table("rooms").clear();
      });
  }
}

export const db = new AppDatabase();
