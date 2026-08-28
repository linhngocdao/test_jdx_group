/**
 * Vòng đời khoá học. Chuyển đổi hợp lệ:
 * draft -> open -> ongoing -> finished
 *            \-> cancelled
 *      ongoing -> cancelled (trường hợp đặc biệt, hiếm)
 *
 * - draft: mới tạo, chưa mở đăng ký.
 * - open: đang nhận đăng ký học viên.
 * - ongoing: đã khai giảng, đang diễn ra các buổi học.
 * - finished: đã hoàn thành toàn bộ buổi học.
 * - cancelled: bị huỷ (chủ động hoặc tự động do không đủ học viên tối thiểu khi đến ngày khai giảng).
 */
export type CourseStatus = "draft" | "open" | "ongoing" | "finished" | "cancelled";

/**
 * Course không kế thừa `BaseEntity` — nó không có khái niệm "tạm ngưng hoạt
 * động" như giảng viên/phòng học/học viên, mà có vòng đời riêng qua
 * `courseStatus`. Kế thừa `BaseEntity` sẽ mang theo field `status` thừa và
 * dễ gây nhầm với `courseStatus`.
 */
export interface Course {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  /** Giảng viên phụ trách chính — mặc định khi tạo buổi học mới, luôn có mặt trong `teacherIds`. */
  teacherId: string;
  /** Phòng học mặc định — luôn có mặt trong `roomIds`. */
  roomId: string;
  /**
   * Toàn bộ giảng viên được phép dạy khoá học này — khi lên lịch từng buổi,
   * chỉ được chọn giảng viên trong danh sách này (không phải toàn bộ giảng
   * viên active của trung tâm), để việc phân công buổi/phòng luôn nằm trong
   * phạm vi đã duyệt cho khoá học.
   */
  teacherIds: string[];
  /** Toàn bộ phòng học được phép dùng cho khoá học này — cùng lý do với `teacherIds`. */
  roomIds: string[];
  /** Số học viên tối thiểu để khoá học được phép khai giảng — dưới mức này tại ngày khai giảng sẽ tự huỷ. */
  minStudents: number;
  /** Số học viên tối đa — mặc định lấy theo sức chứa phòng học tại thời điểm tạo, có thể chỉnh nhỏ hơn. */
  maxStudents: number;
  startDate: number;
  endDate: number;
  courseStatus: CourseStatus;
  /** Lý do huỷ (nếu courseStatus = cancelled) — phân biệt huỷ thủ công hay tự động do thiếu học viên. */
  cancelReason?: string;
  note?: string;
}

export type CourseInput = Omit<
  Course,
  "id" | "createdAt" | "updatedAt" | "courseStatus" | "cancelReason"
>;

/** Hành động hợp lệ theo từng trạng thái khoá học — dùng để UI ẩn/hiện nút thao tác đúng luật. */
export const COURSE_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ["open", "cancelled"],
  open: ["ongoing", "cancelled"],
  ongoing: ["finished", "cancelled"],
  finished: [],
  cancelled: [],
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Nháp",
  open: "Đang mở đăng ký",
  ongoing: "Đang diễn ra",
  finished: "Đã kết thúc",
  cancelled: "Đã huỷ",
};
