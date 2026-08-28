import { createCrudResource } from "@/hooks/use-crud-query";
import { checkTeacherDeleteGuard } from "@/lib/db/delete-guards";
import { db } from "@/lib/db/dexie-db";
import type { Teacher, TeacherInput } from "@/types/teacher";

const teacherResource = createCrudResource<Teacher, TeacherInput>({
  queryKey: "teachers",
  table: db.teachers,
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
  checkDeleteGuard: checkTeacherDeleteGuard,
});

export const {
  useList: useTeacherList,
  useEntity: useTeacher,
  useCreate: useCreateTeacher,
  useUpdate: useUpdateTeacher,
  useRemove: useRemoveTeacher,
  useSetStatus: useSetTeacherStatus,
} = teacherResource;
