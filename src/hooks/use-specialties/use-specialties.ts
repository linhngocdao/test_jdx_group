import { createCrudResource } from "@/hooks/use-crud-query";
import { checkSpecialtyDeleteGuard } from "@/lib/db/delete-guards";
import { db } from "@/lib/db/dexie-db";
import type { Specialty, SpecialtyInput } from "@/types/specialty";

const specialtyResource = createCrudResource<Specialty, SpecialtyInput>({
  queryKey: "specialties",
  table: db.specialties,
  searchableFields: ["name"],
  buildNewEntity: (input) => {
    const now = Date.now();
    return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  },
  applyUpdate: (existing, input) => ({ ...existing, ...input, updatedAt: Date.now() }),
  checkDeleteGuard: checkSpecialtyDeleteGuard,
});

export const {
  useList: useSpecialtyList,
  useEntity: useSpecialty,
  useCreate: useCreateSpecialty,
  useUpdate: useUpdateSpecialty,
  useRemove: useRemoveSpecialty,
  useSetStatus: useSetSpecialtyStatus,
} = specialtyResource;
