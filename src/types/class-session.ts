import type { BaseEntity } from "./entity";

/** Một buổi học cụ thể (ngày giờ, phòng, giảng viên) thuộc về 1 khoá học. */
export interface ClassSession extends BaseEntity {
  courseId: string;
  courseName: string;
  teacherId: string;
  roomId: string;
  /** Danh sách học viên tham gia buổi này — suy ra từ enrollment đã confirmed của course tại thời điểm tạo lịch. */
  studentIds: string[];
  startAt: number;
  endAt: number;
  /** Buổi học đã diễn ra xong hay chưa — dùng để xác định ràng buộc "hoạt động chưa kết thúc". */
  isFinished: boolean;
}

export type ClassSessionInput = Omit<
  ClassSession,
  "id" | "createdAt" | "updatedAt" | "status" | "suspendedReason" | "isFinished"
>;
