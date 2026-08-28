import type { BaseEntity } from "./entity";

export type RoomEquipment = "projector" | "whiteboard" | "computers" | "ac";

export interface Room extends BaseEntity {
  name: string;
  building: string;
  capacity: number;
  equipment: RoomEquipment[];
  note?: string;
}

export type RoomInput = Omit<Room, "id" | "createdAt" | "updatedAt">;
