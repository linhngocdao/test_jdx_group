import { createCrudResource } from "@/hooks/use-crud-query";
import { checkRoomDeleteGuard } from "@/lib/db/delete-guards";
import { db } from "@/lib/db/dexie-db";
import type { Room, RoomInput } from "@/types/room";

const roomResource = createCrudResource<Room, RoomInput>({
  queryKey: "rooms",
  table: db.rooms,
  searchableFields: ["name", "building"],
  buildNewEntity: (input) => {
    const now = Date.now();
    return {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  },
  applyUpdate: (existing, input) => ({
    ...existing,
    ...input,
    updatedAt: Date.now(),
  }),
  checkDeleteGuard: checkRoomDeleteGuard,
});

export const {
  useList: useRoomList,
  useEntity: useRoom,
  useCreate: useCreateRoom,
  useUpdate: useUpdateRoom,
  useRemove: useRemoveRoom,
  useSetStatus: useSetRoomStatus,
} = roomResource;
