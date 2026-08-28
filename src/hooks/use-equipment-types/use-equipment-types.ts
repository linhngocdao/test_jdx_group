import { createCrudResource } from "@/hooks/use-crud-query";
import { checkEquipmentTypeDeleteGuard } from "@/lib/db/delete-guards";
import { db } from "@/lib/db/dexie-db";
import type { EquipmentType, EquipmentTypeInput } from "@/types/equipment-type";

const equipmentTypeResource = createCrudResource<EquipmentType, EquipmentTypeInput>({
  queryKey: "equipment-types",
  table: db.equipmentTypes,
  searchableFields: ["name"],
  buildNewEntity: (input) => {
    const now = Date.now();
    return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  },
  applyUpdate: (existing, input) => ({ ...existing, ...input, updatedAt: Date.now() }),
  checkDeleteGuard: checkEquipmentTypeDeleteGuard,
});

export const {
  useList: useEquipmentTypeList,
  useEntity: useEquipmentType,
  useCreate: useCreateEquipmentType,
  useUpdate: useUpdateEquipmentType,
  useRemove: useRemoveEquipmentType,
  useSetStatus: useSetEquipmentTypeStatus,
} = equipmentTypeResource;
