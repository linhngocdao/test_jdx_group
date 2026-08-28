import Dexie, { type EntityTable } from "dexie";

import type { ClassSession } from "@/types/class-session";
import type { Course } from "@/types/course";
import type { Enrollment } from "@/types/enrollment";
import type { Room } from "@/types/room";
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
  }
}

export const db = new AppDatabase();
