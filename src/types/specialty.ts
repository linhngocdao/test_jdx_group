import type { BaseEntity } from "./entity";

/** Danh mục chuyên môn giảng dạy — quản lý được (thêm/sửa/tạm ẩn) thay vì cố định cứng trong code. */
export interface Specialty extends BaseEntity {
  name: string;
}

export type SpecialtyInput = Omit<Specialty, "id" | "createdAt" | "updatedAt">;
