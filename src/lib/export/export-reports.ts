import { db } from "@/lib/db/dexie-db";
import { downloadExcel, type ExcelColumn } from "@/lib/export/xlsx-export";
import { ENROLLMENT_STATUS_LABELS } from "@/types/enrollment";

interface CourseStudentRow {
  fullName: string;
  email: string;
  phone: string;
  enrollmentStatus: string;
}

/** Xuất danh sách học viên của 1 khoá học kèm thông tin liên hệ và trạng thái đăng ký. */
export async function exportCourseStudentList(courseId: string): Promise<void> {
  const course = await db.courses.get(courseId);
  if (!course) throw new Error("Không tìm thấy khoá học.");

  const enrollments = await db.enrollments.where("courseId").equals(courseId).toArray();
  const students = await db.students.bulkGet(enrollments.map((e) => e.studentId));

  const rows: CourseStudentRow[] = enrollments.map((enrollment, index) => ({
    fullName: students[index]?.fullName ?? "(Học viên đã xoá)",
    email: students[index]?.email ?? "",
    phone: students[index]?.phone ?? "",
    enrollmentStatus: ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus],
  }));

  const columns: ExcelColumn<CourseStudentRow>[] = [
    { header: "Họ tên", getValue: (r) => r.fullName },
    { header: "Email", getValue: (r) => r.email },
    { header: "Số điện thoại", getValue: (r) => r.phone },
    { header: "Trạng thái đăng ký", getValue: (r) => r.enrollmentStatus },
  ];

  downloadExcel(`danh-sach-hoc-vien_${course.name}`, rows, columns);
}

interface TeacherScheduleRow {
  courseName: string;
  roomName: string;
  startAt: string;
  endAt: string;
  status: string;
}

function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(epochMs);
}

/** Xuất lịch dạy của 1 giảng viên — toàn bộ khoá, địa điểm, thời gian của mọi buổi học. */
export async function exportTeacherSchedule(teacherId: string): Promise<void> {
  const teacher = await db.teachers.get(teacherId);
  if (!teacher) throw new Error("Không tìm thấy giảng viên.");

  const sessions = await db.classSessions
    .where("teacherId")
    .equals(teacherId)
    .sortBy("startAt");
  const rooms = await db.rooms.bulkGet(sessions.map((s) => s.roomId));

  const rows: TeacherScheduleRow[] = sessions.map((session, index) => ({
    courseName: session.courseName,
    roomName: rooms[index]?.name ?? "(Phòng đã xoá)",
    startAt: formatDateTime(session.startAt),
    endAt: formatDateTime(session.endAt),
    status: session.isFinished ? "Đã diễn ra" : "Sắp diễn ra",
  }));

  const columns: ExcelColumn<TeacherScheduleRow>[] = [
    { header: "Khoá học", getValue: (r) => r.courseName },
    { header: "Phòng học", getValue: (r) => r.roomName },
    { header: "Bắt đầu", getValue: (r) => r.startAt },
    { header: "Kết thúc", getValue: (r) => r.endAt },
    { header: "Trạng thái", getValue: (r) => r.status },
  ];

  downloadExcel(`lich-day_${teacher.fullName}`, rows, columns);
}
