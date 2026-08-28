import type { BaseEntity } from "./entity";

export type TeacherSpecialty =
  | "frontend"
  | "backend"
  | "mobile"
  | "data"
  | "design"
  | "other";

export interface Teacher extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  specialty: TeacherSpecialty;
  /** Số buổi dạy đang được phân công trong tuần — dùng để cảnh báo quá tải. */
  weeklySessionLoad: number;
  bio?: string;
  avatarSeed: string;
}

export type TeacherInput = Omit<
  Teacher,
  "id" | "createdAt" | "updatedAt" | "avatarSeed"
>;
