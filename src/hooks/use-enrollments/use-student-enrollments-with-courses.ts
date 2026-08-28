import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import type { Enrollment } from "@/types/enrollment";

export interface StudentEnrollmentWithCourse extends Enrollment {
  courseName: string;
  courseStatus: string;
  teacherName: string;
  roomName: string;
  startDate: number;
}

/** Đăng ký của 1 học viên kèm thông tin khoá học — dùng cho trang chi tiết học viên. */
export function useStudentEnrollmentsWithCourses(studentId: string | undefined) {
  return useQuery({
    queryKey: ["enrollments", "by-student-with-courses", studentId],
    queryFn: async (): Promise<StudentEnrollmentWithCourse[]> => {
      const enrollments = await db.enrollments
        .where("studentId")
        .equals(studentId as string)
        .toArray();

      const courses = await db.courses.bulkGet(enrollments.map((e) => e.courseId));
      const teachers = await db.teachers.bulkGet(courses.map((c) => c?.teacherId ?? ""));
      const rooms = await db.rooms.bulkGet(courses.map((c) => c?.roomId ?? ""));

      return enrollments.map((enrollment, index) => ({
        ...enrollment,
        courseName: courses[index]?.name ?? "(Khoá học đã xoá)",
        courseStatus: courses[index]?.courseStatus ?? "cancelled",
        teacherName: teachers[index]?.fullName ?? "—",
        roomName: rooms[index]?.name ?? "—",
        startDate: courses[index]?.startDate ?? 0,
      }));
    },
    enabled: Boolean(studentId),
  });
}
