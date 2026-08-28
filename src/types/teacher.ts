import type { BaseEntity } from "./entity";

export interface Teacher extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  /** Tham chiếu tới Specialty.id — danh mục chuyên môn quản lý được trong Cài đặt, không cố định cứng. */
  specialtyId: string;
  /** Số buổi dạy đang được phân công trong tuần — dùng để cảnh báo quá tải. */
  weeklySessionLoad: number;
  bio?: string;
  avatarSeed: string;
}

export type TeacherInput = Omit<
  Teacher,
  "id" | "createdAt" | "updatedAt" | "avatarSeed"
>;
