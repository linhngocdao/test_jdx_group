import type { BaseEntity } from "./entity";

export interface Student extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  /** Ngày sinh, lưu dạng epoch ms để dễ sort/filter. */
  dateOfBirth: number;
  address?: string;
  avatarSeed: string;
}

export type StudentInput = Omit<
  Student,
  "id" | "createdAt" | "updatedAt" | "avatarSeed"
>;
