import { db } from "@/lib/db/dexie-db";
import { autoCancelUnderEnrolledCourses, countConfirmedEnrollmentsBulk } from "@/lib/scheduling/course-lifecycle";
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

export interface MonthlyPoint {
  /** Nhãn tháng dạng "T1/2026" để hiển thị trục X. */
  label: string;
  /** Mốc đầu tháng (epoch ms) — dùng để sort/so sánh. */
  monthStart: number;
  newStudents: number;
  newCourses: number;
  /** true nếu đây là điểm dự đoán (chưa xảy ra), không phải dữ liệu thật. */
  isForecast?: boolean;
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
  /** Học viên/khoá học mới theo tháng, 6 tháng gần nhất + 1 tháng dự đoán (hồi quy tuyến tính). */
  growthSeries: MonthlyPoint[];
}

const AT_RISK_WINDOW_DAYS = 14;
/** Ngưỡng số buổi dạy sắp tới được coi là quá tải — cùng ngưỡng với cảnh báo trong bảng giảng viên. */
const OVERLOAD_SESSION_THRESHOLD = 10;
const GROWTH_WINDOW_MONTHS = 6;

function startOfMonth(epochMs: number): number {
  const d = new Date(epochMs);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function addMonths(epochMs: number, count: number): number {
  const d = new Date(epochMs);
  return new Date(d.getFullYear(), d.getMonth() + count, 1).getTime();
}

function formatMonthLabel(epochMs: number): string {
  const d = new Date(epochMs);
  return `T${d.getMonth() + 1}/${d.getFullYear()}`;
}

/**
 * Hồi quy tuyến tính đơn giản (least squares) trên N điểm gần nhất để dự
 * đoán điểm tiếp theo — đúng yêu cầu "dự đoán tỉ lệ tăng trưởng". Không cần
 * độ chính xác thống kê cao, chỉ cần thể hiện xu hướng (đang tăng/giảm/đi ngang).
 */
function forecastNext(values: number[]): number {
  const n = values.length;
  if (n < 2) return values[0] ?? 0;

  const xs = values.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const nextValue = intercept + slope * n;

  return Math.max(0, Math.round(nextValue));
}

/** Học viên/khoá học mới theo từng tháng trong `GROWTH_WINDOW_MONTHS` tháng gần nhất, cộng 1 tháng dự đoán. */
function buildGrowthSeries(
  students: { createdAt: number }[],
  courses: { createdAt: number }[]
): MonthlyPoint[] {
  const now = Date.now();
  const currentMonthStart = startOfMonth(now);
  const firstMonthStart = addMonths(currentMonthStart, -(GROWTH_WINDOW_MONTHS - 1));

  const months: { monthStart: number; label: string }[] = Array.from(
    { length: GROWTH_WINDOW_MONTHS },
    (_, i) => {
      const monthStart = addMonths(firstMonthStart, i);
      return { monthStart, label: formatMonthLabel(monthStart) };
    }
  );

  function countByMonth(items: { createdAt: number }[]): number[] {
    return months.map(
      ({ monthStart }) =>
        items.filter(
          (item) => item.createdAt >= monthStart && item.createdAt < addMonths(monthStart, 1)
        ).length
    );
  }

  const studentCounts = countByMonth(students);
  const courseCounts = countByMonth(courses);

  const historical: MonthlyPoint[] = months.map((m, i) => ({
    label: m.label,
    monthStart: m.monthStart,
    newStudents: studentCounts[i],
    newCourses: courseCounts[i],
  }));

  const forecastMonthStart = addMonths(currentMonthStart, 1);
  const forecastPoint: MonthlyPoint = {
    label: formatMonthLabel(forecastMonthStart),
    monthStart: forecastMonthStart,
    newStudents: forecastNext(studentCounts),
    newCourses: forecastNext(courseCounts),
    isForecast: true,
  };

  return [...historical, forecastPoint];
}

/**
 * Tổng hợp số liệu cho màn hình dashboard — đúng yêu cầu "ban giám đốc cần
 * nhìn thấy trạng thái vận hành": bao nhiêu khoá đang mở/diễn ra/kết thúc,
 * khoá nào có nguy cơ phải huỷ vì sắp khai giảng mà chưa đủ học viên, giảng
 * viên nào đang có lịch quá nhiều.
 */
export async function computeDashboardMetrics(): Promise<DashboardMetrics> {
  await autoCancelUnderEnrolledCourses();

  const [courses, activeTeachers, activeStudents, activeRoomsCount, upcomingSessions] =
    await Promise.all([
      db.courses.toArray(),
      db.teachers.where("status").equals("active").toArray(),
      db.students.where("status").equals("active").toArray(),
      db.rooms.where("status").equals("active").count(),
      db.classSessions.filter((s) => !s.isFinished).toArray(),
    ]);
  const activeStudentsCount = activeStudents.length;

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
  const confirmedCounts = await countConfirmedEnrollmentsBulk(openCourses.map((c) => c.id));

  const atRiskCourses: AtRiskCourse[] = openCourses
    .map((course) => ({
      ...course,
      confirmedCount: confirmedCounts.get(course.id) ?? 0,
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

  const growthSeries = buildGrowthSeries(activeStudents, courses);

  return {
    statusCounts,
    totalActiveTeachers: activeTeachers.length,
    totalActiveStudents: activeStudentsCount,
    totalActiveRooms: activeRoomsCount,
    atRiskCourses,
    teacherLoadRanking,
    growthSeries,
  };
}
