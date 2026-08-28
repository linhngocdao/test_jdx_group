import { db } from "./dexie-db";
import type { ClassSession } from "@/types/class-session";
import type { Course, CourseStatus } from "@/types/course";
import type { Enrollment, EnrollmentStatus } from "@/types/enrollment";
import type { Room, RoomEquipment } from "@/types/room";
import type { Student } from "@/types/student";
import type { Teacher, TeacherSpecialty } from "@/types/teacher";

const FIRST_NAMES = [
  "Minh", "Hà", "Lan", "Tuấn", "Hương", "Quang", "Trang", "Nam", "Linh", "Phong",
  "Thảo", "Đức", "Ngọc", "Sơn", "Hạnh", "Khoa", "Yến", "Long", "Vy", "Đạt",
];
const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
];
const SPECIALTIES: TeacherSpecialty[] = ["frontend", "backend", "mobile", "data", "design", "other"];
const EQUIPMENT_POOL: RoomEquipment[] = ["projector", "whiteboard", "computers", "ac"];
const BUILDINGS = ["Tòa A", "Tòa B", "Tòa C"];
const COURSE_TOPICS = [
  "Python cơ bản", "JavaScript nâng cao", "React từ đầu", "Node.js backend",
  "Thiết kế UI/UX", "SQL cho người mới", "Java OOP", "Flutter mobile",
  "Data Analysis với Pandas", "DevOps cơ bản", "Kiểm thử phần mềm", "Git & GitHub",
];

const DAY_MS = 86_400_000;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName(): string {
  return `${pick(LAST_NAMES)} ${pick(FIRST_NAMES)} ${pick(FIRST_NAMES)}`;
}

function randomPhone(): string {
  return `09${randomInt(10000000, 99999999)}`;
}

function makeSlug(name: string, index: number): string {
  return `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/\s+/g, ".")}${index}`;
}

/**
 * Mốc thời gian rải trong N tháng gần nhất, thiên nhẹ về các tháng gần hiện
 * tại hơn (tăng trưởng có xu hướng) — dùng cho `createdAt` của học viên và
 * khoá học, để biểu đồ tăng trưởng trên dashboard có dữ liệu thực thay vì
 * dồn hết vào 1 tháng hoặc rơi ngoài cửa sổ hiển thị.
 */
function randomCreatedAtWithinMonths(now: number, months: number): number {
  const monthIndex = Math.floor(Math.pow(Math.random(), 1.4) * months);
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - monthIndex, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const span = Math.min(monthEnd.getTime(), now) - monthStart.getTime();
  return monthStart.getTime() + Math.floor(Math.random() * Math.max(span, 1));
}

/** Sinh dữ liệu mẫu để demo table với số lượng bản ghi lớn — mặc định nhẹ, có thể tăng qua tham số. */
export async function seedDatabase(options?: {
  teacherCount?: number;
  studentCount?: number;
  roomCount?: number;
  courseCount?: number;
}): Promise<void> {
  const teacherCount = options?.teacherCount ?? 40;
  const studentCount = options?.studentCount ?? 5000;
  const roomCount = options?.roomCount ?? 12;
  const courseCount = options?.courseCount ?? 40;

  const now = Date.now();

  const teachers: Teacher[] = Array.from({ length: teacherCount }, (_, i) => {
    const fullName = randomName();
    const suspended = Math.random() < 0.08;
    return {
      id: crypto.randomUUID(),
      fullName,
      email: `${makeSlug(fullName, i)}@center.edu.vn`,
      phone: randomPhone(),
      specialty: pick(SPECIALTIES),
      weeklySessionLoad: randomInt(0, 14),
      bio: undefined,
      avatarSeed: makeSlug(fullName, i),
      status: suspended ? "suspended" : "active",
      suspendedReason: suspended ? "Giảng viên nghỉ dài hạn" : undefined,
      createdAt: now - randomInt(0, 365) * DAY_MS,
      updatedAt: now,
    };
  });

  const students: Student[] = Array.from({ length: studentCount }, (_, i) => {
    const fullName = randomName();
    const suspended = Math.random() < 0.05;
    return {
      id: crypto.randomUUID(),
      fullName,
      email: `${makeSlug(fullName, i)}@student.center.edu.vn`,
      phone: randomPhone(),
      dateOfBirth: now - randomInt(18, 30) * 365 * DAY_MS,
      address: undefined,
      avatarSeed: makeSlug(fullName, i),
      status: suspended ? "suspended" : "active",
      suspendedReason: suspended ? "Học viên bảo lưu" : undefined,
      createdAt: randomCreatedAtWithinMonths(now, 6),
      updatedAt: now,
    };
  });

  const rooms: Room[] = Array.from({ length: roomCount }, (_, i) => {
    const suspended = Math.random() < 0.1;
    const equipmentCount = randomInt(1, EQUIPMENT_POOL.length);
    const equipment = [...EQUIPMENT_POOL].sort(() => Math.random() - 0.5).slice(0, equipmentCount);
    return {
      id: crypto.randomUUID(),
      name: `P.${100 + i}`,
      building: pick(BUILDINGS),
      capacity: pick([15, 20, 25, 30, 40]),
      equipment,
      note: undefined,
      status: suspended ? "suspended" : "active",
      suspendedReason: suspended ? "Phòng đang sửa chữa" : undefined,
      createdAt: now - randomInt(0, 365) * DAY_MS,
      updatedAt: now,
    };
  });

  const activeTeachers = teachers.filter((t) => t.status === "active");
  const activeRooms = rooms.filter((r) => r.status === "active");
  const activeStudents = students.filter((s) => s.status === "active");

  // Phân bố trạng thái khoá học đa dạng để demo dashboard/enroll có đủ tình huống.
  const COURSE_STATUS_DISTRIBUTION: CourseStatus[] = [
    "draft", "open", "open", "open", "ongoing", "ongoing", "finished", "finished", "cancelled",
  ];

  const courses: Course[] = Array.from({ length: courseCount }, (_, i) => {
    const courseStatus = pick(COURSE_STATUS_DISTRIBUTION);
    const teacher = pick(activeTeachers);
    const room = pick(activeRooms);
    const minStudents = pick([5, 8, 10]);

    // startDate lệch theo trạng thái để hợp lý: draft/open ở tương lai, ongoing quanh hiện tại, finished ở quá khứ.
    let startDate: number;
    if (courseStatus === "finished" || courseStatus === "cancelled") {
      startDate = now - randomInt(10, 90) * DAY_MS;
    } else if (courseStatus === "ongoing") {
      startDate = now - randomInt(1, 10) * DAY_MS;
    } else {
      startDate = now + randomInt(3, 45) * DAY_MS;
    }

    return {
      id: crypto.randomUUID(),
      name: `${pick(COURSE_TOPICS)} #${i + 1}`,
      teacherId: teacher?.id ?? "",
      roomId: room?.id ?? "",
      minStudents,
      maxStudents: room?.capacity ?? 20,
      startDate,
      endDate: startDate + randomInt(20, 60) * DAY_MS,
      courseStatus,
      cancelReason: courseStatus === "cancelled" ? "Không đủ học viên tối thiểu khi khai giảng." : undefined,
      note: undefined,
      // Ngày tạo khoá học rải trong 6 tháng gần nhất (độc lập với startDate) —
      // để biểu đồ tăng trưởng "khoá học mới theo tháng" trên dashboard có dữ
      // liệu thực thay vì phụ thuộc startDate (có thể ở rất xa quá khứ/tương lai).
      createdAt: randomCreatedAtWithinMonths(now, 6),
      updatedAt: now,
    };
  }).filter((c) => c.teacherId && c.roomId);

  // Đảm bảo LUÔN có vài khoá học "sắp huỷ vì thiếu học viên" và vài khoá học
  // "sắp khai giảng đã đủ chỗ" — không để hoàn toàn phụ thuộc random, vì
  // dashboard cần các tình huống này để demo có ý nghĩa (đúng yêu cầu "phải
  // seed dữ liệu để đều có khoá học nguy cơ huỷ với giảng viên quá tải").
  const openCourses = courses.filter((c) => c.courseStatus === "open");
  const atRiskCandidates = openCourses.slice(0, Math.min(3, openCourses.length));
  for (const course of atRiskCandidates) {
    course.startDate = now + randomInt(2, 10) * DAY_MS;
    course.minStudents = 8;
  }

  // Sinh enrollment mẫu cho các khoá open/ongoing/finished để dashboard và trang đăng ký có dữ liệu thực.
  const enrollments: Enrollment[] = [];
  const atRiskIds = new Set(atRiskCandidates.map((c) => c.id));

  for (const course of courses) {
    if (course.courseStatus === "draft" || course.courseStatus === "cancelled") continue;

    // Khoá "at-risk" cố tình chỉ có 1-3 đăng ký xác nhận — dưới mức tối thiểu (8).
    const targetCount = atRiskIds.has(course.id)
      ? randomInt(1, 3)
      : randomInt(
          Math.max(0, course.minStudents - 2),
          Math.min(course.maxStudents, course.minStudents + 6)
        );

    const usedIds = new Set<string>();

    for (let i = 0; i < targetCount; i += 1) {
      const student = pick(activeStudents);
      if (!student || usedIds.has(student.id)) continue;
      usedIds.add(student.id);

      let enrollmentStatus: EnrollmentStatus = "confirmed";
      if (course.courseStatus === "open") {
        enrollmentStatus = Math.random() < 0.3 ? "pending" : "confirmed";
      } else if (course.courseStatus === "finished") {
        enrollmentStatus = "completed";
      }

      enrollments.push({
        id: crypto.randomUUID(),
        studentId: student.id,
        courseId: course.id,
        enrollmentStatus,
        cancelReason: undefined,
        status: "active",
        createdAt: course.createdAt + randomInt(1, 5) * DAY_MS,
        updatedAt: now,
      });
    }
  }

  // Sinh buổi học sắp tới cho khoá "ongoing" — cần thiết để "Giảng viên đang
  // quá tải" trên dashboard (đếm theo classSessions chưa kết thúc) có dữ liệu.
  // Vài giảng viên cố định được dồn nhiều buổi để chắc chắn vượt ngưỡng quá tải (10).
  const ongoingCourses = courses.filter((c) => c.courseStatus === "ongoing");
  const overloadedTeacherIds = new Set(
    activeTeachers.slice(0, Math.min(3, activeTeachers.length)).map((t) => t.id)
  );

  const classSessions: ClassSession[] = [];
  for (const course of ongoingCourses) {
    const isOverloadedTeacher = overloadedTeacherIds.has(course.teacherId);
    const sessionCount = isOverloadedTeacher ? randomInt(6, 9) : randomInt(2, 5);

    for (let i = 0; i < sessionCount; i += 1) {
      const dayOffset = randomInt(1, 30);
      const hour = pick([8, 9, 14, 18, 19]);
      const startDate = new Date(now + dayOffset * DAY_MS);
      startDate.setHours(hour, 0, 0, 0);
      const startAt = startDate.getTime();

      classSessions.push({
        id: crypto.randomUUID(),
        courseId: course.id,
        courseName: course.name,
        teacherId: course.teacherId,
        roomId: course.roomId,
        studentIds: [],
        startAt,
        endAt: startAt + 2 * 60 * 60 * 1000,
        isFinished: false,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Đảm bảo các giảng viên "quá tải" chắc chắn đạt ngưỡng dù courses của họ
  // ít — bù thêm buổi học rải rác gắn với phòng/khoá học ongoing sẵn có.
  const fallbackCourse = ongoingCourses[0];
  if (fallbackCourse) {
    for (const teacherId of overloadedTeacherIds) {
      const currentCount = classSessions.filter((s) => s.teacherId === teacherId).length;
      for (let i = currentCount; i < 11; i += 1) {
        const dayOffset = randomInt(1, 30);
        const hour = pick([8, 9, 14, 18, 19]);
        const startDate = new Date(now + dayOffset * DAY_MS);
        startDate.setHours(hour, 0, 0, 0);
        const startAt = startDate.getTime();

        classSessions.push({
          id: crypto.randomUUID(),
          courseId: fallbackCourse.id,
          courseName: fallbackCourse.name,
          teacherId,
          roomId: fallbackCourse.roomId,
          studentIds: [],
          startAt,
          endAt: startAt + 2 * 60 * 60 * 1000,
          isFinished: false,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  await db.transaction(
    "rw",
    [db.teachers, db.students, db.rooms, db.courses, db.enrollments, db.classSessions],
    async () => {
      await db.teachers.bulkAdd(teachers);
      await db.students.bulkAdd(students);
      await db.rooms.bulkAdd(rooms);
      await db.courses.bulkAdd(courses);
      await db.enrollments.bulkAdd(enrollments);
      await db.classSessions.bulkAdd(classSessions);
    }
  );
}

export async function clearDatabase(): Promise<void> {
  await db.transaction(
    "rw",
    [db.teachers, db.students, db.rooms, db.courses, db.classSessions, db.enrollments],
    async () => {
      await Promise.all([
        db.teachers.clear(),
        db.students.clear(),
        db.rooms.clear(),
        db.courses.clear(),
        db.classSessions.clear(),
        db.enrollments.clear(),
      ]);
    }
  );
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const count = await db.teachers.count();
  return count === 0;
}
