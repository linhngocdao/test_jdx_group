import { db } from "./dexie-db";
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
  const courseCount = options?.courseCount ?? 15;

  const now = Date.now();
  const DAY_MS = 86_400_000;

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
      createdAt: now - randomInt(0, 365) * DAY_MS,
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
    "draft", "open", "open", "open", "ongoing", "ongoing", "finished", "cancelled",
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
      createdAt: startDate - randomInt(5, 20) * DAY_MS,
      updatedAt: now,
    };
  }).filter((c) => c.teacherId && c.roomId);

  // Sinh enrollment mẫu cho các khoá open/ongoing/finished để dashboard và trang đăng ký có dữ liệu thực.
  const enrollments: Enrollment[] = [];
  const usedStudentIdsByCourse = new Map<string, Set<string>>();

  for (const course of courses) {
    if (course.courseStatus === "draft" || course.courseStatus === "cancelled") continue;

    const targetCount = randomInt(
      Math.max(0, course.minStudents - 2),
      Math.min(course.maxStudents, course.minStudents + 6)
    );
    const usedIds = new Set<string>();
    usedStudentIdsByCourse.set(course.id, usedIds);

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

  await db.transaction(
    "rw",
    db.teachers,
    db.students,
    db.rooms,
    db.courses,
    db.enrollments,
    async () => {
      await db.teachers.bulkAdd(teachers);
      await db.students.bulkAdd(students);
      await db.rooms.bulkAdd(rooms);
      await db.courses.bulkAdd(courses);
      await db.enrollments.bulkAdd(enrollments);
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
