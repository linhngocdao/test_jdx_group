import { db } from "@/lib/db/dexie-db";
import { autoCancelUnderEnrolledCourses, countConfirmedEnrollments } from "@/lib/scheduling/course-lifecycle";
import type { Course } from "@/types/course";
import type { Teacher } from "@/types/teacher";

export interface CourseStatusCounts {
  draft: number;
  open: number;
  ongoing: number;
  finished: number;
  cancelled: number;
}

export interface AtRiskCourse extends Course {
  confirmedCount: number;
  daysUntilStart: number;
}

export interface OverloadedTeacher extends Teacher {
  upcomingSessionCount: number;
}

export interface DashboardMetrics {
  statusCounts: CourseStatusCounts;
  totalActiveTeachers: number;
  totalActiveStudents: number;
  totalActiveRooms: number;
  /** Khoá "open" sắp khai giảng (trong N ngày tới) mà vẫn chưa đạt tối thiểu — nguy cơ phải huỷ. */
  atRiskCourses: AtRiskCourse[];
  /** Giảng viên có nhiều buổi dạy sắp tới nhất — dùng để phát hiện quá tải phân công. */
  teacherLoadRanking: OverloadedTeacher[];
}

const AT_RISK_WINDOW_DAYS = 14;
/** Ngưỡng số buổi dạy sắp tới được coi là quá tải — cùng ngưỡng với cảnh báo trong bảng giảng viên. */
const OVERLOAD_SESSION_THRESHOLD = 10;

/**
 * Tổng hợp số liệu cho màn hình dashboard — đúng yêu cầu "ban giám đốc cần
 * nhìn thấy trạng thái vận hành": bao nhiêu khoá đang mở/diễn ra/kết thúc,
 * khoá nào có nguy cơ phải huỷ vì sắp khai giảng mà chưa đủ học viên, giảng
 * viên nào đang có lịch quá nhiều.
 */
export async function computeDashboardMetrics(): Promise<DashboardMetrics> {
  await autoCancelUnderEnrolledCourses();

  const [courses, activeTeachers, activeStudentsCount, activeRoomsCount, upcomingSessions] =
    await Promise.all([
      db.courses.toArray(),
      db.teachers.where("status").equals("active").toArray(),
      db.students.where("status").equals("active").count(),
      db.rooms.where("status").equals("active").count(),
      db.classSessions.filter((s) => !s.isFinished).toArray(),
    ]);

  const statusCounts: CourseStatusCounts = {
    draft: 0,
    open: 0,
    ongoing: 0,
    finished: 0,
    cancelled: 0,
  };
  for (const course of courses) {
    statusCounts[course.courseStatus] += 1;
  }

  const now = Date.now();
  const riskWindowMs = AT_RISK_WINDOW_DAYS * 86_400_000;
  const openCourses = courses.filter((c) => c.courseStatus === "open");
  const confirmedCounts = await Promise.all(openCourses.map((c) => countConfirmedEnrollments(c.id)));

  const atRiskCourses: AtRiskCourse[] = openCourses
    .map((course, index) => ({
      ...course,
      confirmedCount: confirmedCounts[index],
      daysUntilStart: Math.ceil((course.startDate - now) / 86_400_000),
    }))
    .filter(
      (course) =>
        course.startDate - now <= riskWindowMs &&
        course.startDate >= now &&
        course.confirmedCount < course.minStudents
    )
    .sort((a, b) => a.daysUntilStart - b.daysUntilStart);

  const sessionCountByTeacher = new Map<string, number>();
  for (const session of upcomingSessions) {
    sessionCountByTeacher.set(session.teacherId, (sessionCountByTeacher.get(session.teacherId) ?? 0) + 1);
  }

  const teacherLoadRanking: OverloadedTeacher[] = activeTeachers
    .map((teacher) => ({
      ...teacher,
      upcomingSessionCount: sessionCountByTeacher.get(teacher.id) ?? 0,
    }))
    .filter((t) => t.upcomingSessionCount >= OVERLOAD_SESSION_THRESHOLD)
    .sort((a, b) => b.upcomingSessionCount - a.upcomingSessionCount);

  return {
    statusCounts,
    totalActiveTeachers: activeTeachers.length,
    totalActiveStudents: activeStudentsCount,
    totalActiveRooms: activeRoomsCount,
    atRiskCourses,
    teacherLoadRanking,
  };
}
