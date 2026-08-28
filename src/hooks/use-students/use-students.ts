import { createCrudResource } from "@/hooks/use-crud-query";
import { checkStudentDeleteGuard } from "@/lib/db/delete-guards";
import { db } from "@/lib/db/dexie-db";
import type { Student, StudentInput } from "@/types/student";

const studentResource = createCrudResource<Student, StudentInput>({
  queryKey: "students",
  table: db.students,
  searchableFields: ["fullName", "email", "phone"],
  buildNewEntity: (input) => {
    const now = Date.now();
    return {
      ...input,
      id: crypto.randomUUID(),
      avatarSeed: input.fullName,
      createdAt: now,
      updatedAt: now,
    };
  },
  applyUpdate: (existing, input) => ({
    ...existing,
    ...input,
    updatedAt: Date.now(),
  }),
  checkDeleteGuard: checkStudentDeleteGuard,
});

export const {
  useList: useStudentList,
  useEntity: useStudent,
  useCreate: useCreateStudent,
  useUpdate: useUpdateStudent,
  useRemove: useRemoveStudent,
  useSetStatus: useSetStudentStatus,
} = studentResource;
