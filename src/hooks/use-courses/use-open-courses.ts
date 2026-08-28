import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import { autoCancelUnderEnrolledCourses, countConfirmedEnrollments } from "@/lib/scheduling/course-lifecycle";
import type { Course } from "@/types/course";

export interface OpenCourseSummary extends Course {
  teacherName: string;
  roomName: string;
  confirmedCount: number;
}

/** Danh sách khoá học đang mở đăng ký — dùng cho trang tự đăng ký của học viên. */
export function useOpenCourses() {
  return useQuery({
    queryKey: ["courses", "open-list"],
    queryFn: async (): Promise<OpenCourseSummary[]> => {
      await autoCancelUnderEnrolledCourses();
      const openCourses = await db.courses.where("courseStatus").equals("open").toArray();

      const [teachers, rooms, confirmedCounts] = await Promise.all([
        db.teachers.bulkGet(openCourses.map((c) => c.teacherId)),
        db.rooms.bulkGet(openCourses.map((c) => c.roomId)),
        Promise.all(openCourses.map((c) => countConfirmedEnrollments(c.id))),
      ]);

      return openCourses.map((course, index) => ({
        ...course,
        teacherName: teachers[index]?.fullName ?? "(Đã xoá)",
        roomName: rooms[index]?.name ?? "(Đã xoá)",
        confirmedCount: confirmedCounts[index],
      }));
    },
  });
}
