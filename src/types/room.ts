import type { BaseEntity } from "./entity";

export interface Room extends BaseEntity {
  name: string;
  building: string;
  capacity: number;
  /** Tham chiếu tới EquipmentType.id[] — danh mục thiết bị quản lý được trong Cài đặt, không cố định cứng. */
  equipmentTypeIds: string[];
  note?: string;
}

export type RoomInput = Omit<Room, "id" | "createdAt" | "updatedAt">;
