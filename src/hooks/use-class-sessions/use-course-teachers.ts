import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

export interface CourseTeacherSummary {
  id: string;
  fullName: string;
  sessionCount: number;
}

/**
 * Danh sách giáo viên đang thực sự dạy 1 khoá học — suy ra từ các buổi học
 * (ClassSession.teacherId) thay vì chỉ đọc `course.teacherId` cố định, vì
 * mỗi buổi có thể do giáo viên khác nhau phụ trách (dạy thay, đồng giảng dạy).
 */
export function useCourseTeachers(courseId: string | undefined) {
  return useQuery({
    queryKey: ["class-sessions", "course-teachers", courseId],
    queryFn: async (): Promise<CourseTeacherSummary[]> => {
      const sessions = await db.classSessions.where("courseId").equals(courseId as string).toArray();

      const countByTeacher = new Map<string, number>();
      for (const session of sessions) {
        countByTeacher.set(session.teacherId, (countByTeacher.get(session.teacherId) ?? 0) + 1);
      }

      const teacherIds = [...countByTeacher.keys()];
      const teachers = await db.teachers.bulkGet(teacherIds);

      return teacherIds
        .map((id, index) => ({
          id,
          fullName: teachers[index]?.fullName ?? "(Giảng viên đã xoá)",
          sessionCount: countByTeacher.get(id) ?? 0,
        }))
        .sort((a, b) => b.sessionCount - a.sessionCount);
    },
    enabled: Boolean(courseId),
  });
}
