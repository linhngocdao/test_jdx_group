import type { BaseEntity } from "./entity";

/** Danh mục loại trang thiết bị phòng học — quản lý được thay vì cố định cứng trong code. */
export interface EquipmentType extends BaseEntity {
  name: string;
}

export type EquipmentTypeInput = Omit<EquipmentType, "id" | "createdAt" | "updatedAt">;
