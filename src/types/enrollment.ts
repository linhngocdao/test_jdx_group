import type { BaseEntity } from "./entity";

/**
 * Trạng thái đăng ký của 1 học viên vào 1 khoá học. Chuyển đổi hợp lệ:
 * pending -> confirmed -> completed
 *    \-> cancelled        \-> cancelled (huỷ giữa chừng, hiếm)
 * confirmed -> cancelled
 *
 * - pending: vừa đăng ký, chờ xác nhận (đủ điều kiện, còn chỗ, không trùng lịch).
 * - confirmed: đã xác nhận tham gia khoá học.
 * - cancelled: đã huỷ đăng ký (chủ động hoặc do khoá học bị huỷ).
 * - completed: khoá học đã hoàn thành và học viên có mặt xuyên suốt.
 */
export type EnrollmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Enrollment extends BaseEntity {
  studentId: string;
  courseId: string;
  enrollmentStatus: EnrollmentStatus;
  /** Lý do huỷ — phân biệt học viên tự huỷ hay bị huỷ do khoá học cancelled. */
  cancelReason?: string;
}

export type EnrollmentInput = Pick<Enrollment, "studentId" | "courseId">;

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã huỷ",
  completed: "Đã hoàn thành",
};
