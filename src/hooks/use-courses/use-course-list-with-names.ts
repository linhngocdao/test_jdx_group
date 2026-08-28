import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import { autoCancelUnderEnrolledCourses, countConfirmedEnrollmentsBulk } from "@/lib/scheduling/course-lifecycle";
import { queryPaginatedTable } from "@/lib/db/list-query";
import type { Course } from "@/types/course";
import type { ListQueryParams, PaginatedResult } from "@/types/entity";

export interface CourseWithNames extends Course {
  teacherName: string;
  roomName: string;
  confirmedCount: number;
}

/** Danh sách khoá học kèm tên giảng viên/phòng học và số học viên đã xác nhận — dùng cho bảng danh sách. */
export function useCourseListWithNames(
  params: ListQueryParams
): ReturnType<typeof useQuery<PaginatedResult<CourseWithNames>>> {
  return useQuery({
    queryKey: ["courses", "list-with-names", params],
    queryFn: async () => {
      await autoCancelUnderEnrolledCourses();
      const page = await queryPaginatedTable(db.courses, params, { searchableFields: ["name"] });

      const [teachers, rooms, confirmedCounts] = await Promise.all([
        db.teachers.bulkGet(page.rows.map((c) => c.teacherId)),
        db.rooms.bulkGet(page.rows.map((c) => c.roomId)),
        countConfirmedEnrollmentsBulk(page.rows.map((c) => c.id)),
      ]);

      const rows: CourseWithNames[] = page.rows.map((course, index) => ({
        ...course,
        teacherName: teachers[index]?.fullName ?? "(Đã xoá)",
        roomName: rooms[index]?.name ?? "(Đã xoá)",
        confirmedCount: confirmedCounts.get(course.id) ?? 0,
      }));

      return { ...page, rows };
    },
    placeholderData: (previous) => previous,
  });
}
