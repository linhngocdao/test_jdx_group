import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { EntityTable } from "dexie";

import { queryPaginatedTable } from "@/lib/db/list-query";
import type { BaseEntity, DeleteGuardResult, ListQueryParams } from "@/types/entity";

import type { CrudResourceConfig, ListQueryResult } from "./types";

/**
 * Dexie suy luận `IDType<T, "id">` bằng conditional type dựa trên `T` cụ thể,
 * nên không unify được xuyên qua generic `T extends BaseEntity` chưa cụ thể
 * hoá. Mọi entity trong app đều dùng `id: string`, nên bọc `table.get`/
 * `table.delete` qua một interface đã biết id là string để tránh ép kiểu rải
 * rác khắp call site.
 */
interface StringKeyedTable<T extends BaseEntity> {
  get(id: string): Promise<T | undefined>;
  delete(id: string): Promise<void>;
}

function asStringKeyedTable<T extends BaseEntity>(
  table: EntityTable<T, "id">
): StringKeyedTable<T> {
  return table as unknown as StringKeyedTable<T>;
}

/**
 * Core CRUD dùng chung cho mọi hồ sơ client-only: list (search/sort/paginate),
 * create, update, remove, toggle suspend — tất cả chạy qua Dexie (IndexedDB)
 * và được bọc bởi React Query để có cache + invalidation + trạng thái loading
 * giống một app có backend thật, dù không có API nào cả.
 *
 * Mỗi module (giảng viên, học viên, phòng học) chỉ cần khai báo 1
 * `CrudResourceConfig` rồi gọi `createCrudResource` một lần để có đủ bộ hook.
 */
export function createCrudResource<T extends BaseEntity, TInput>(
  config: CrudResourceConfig<T, TInput>
) {
  const { queryKey, table, searchableFields, buildNewEntity, applyUpdate, checkDeleteGuard } =
    config;
  const idTable = asStringKeyedTable(table);

  function useList(params: ListQueryParams): UseQueryResult<ListQueryResult<T>> {
    return useQuery({
      queryKey: [queryKey, "list", params],
      queryFn: () => queryPaginatedTable(table, params, { searchableFields }),
      placeholderData: (previous) => previous,
    });
  }

  function useEntity(id: string | undefined): UseQueryResult<T | undefined> {
    return useQuery({
      queryKey: [queryKey, "detail", id],
      queryFn: () => idTable.get(id as string),
      enabled: Boolean(id),
    });
  }

  function useCreate(): UseMutationResult<T, Error, TInput> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (input: TInput) => {
        const entity = buildNewEntity(input);
        await table.add(entity);
        return entity;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey, "list"] });
      },
    });
  }

  function useUpdate(): UseMutationResult<T, Error, { id: string; input: TInput }> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, input }) => {
        const existing = await idTable.get(id);
        if (!existing) {
          throw new Error("Không tìm thấy hồ sơ để cập nhật.");
        }
        const updated = applyUpdate(existing, input);
        await table.put(updated);
        return updated;
      },
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: [queryKey, "list"] });
        queryClient.setQueryData([queryKey, "detail", updated.id], updated);
      },
    });
  }

  function useRemove(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        if (checkDeleteGuard) {
          const entity = await idTable.get(id);
          if (entity) {
            const guard = await checkDeleteGuard(entity);
            if (!guard.canDelete) {
              throw new DeleteGuardError(guard);
            }
          }
        }
        await idTable.delete(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey, "list"] });
      },
    });
  }

  function useSetStatus(): UseMutationResult<
    T,
    Error,
    { id: string; status: T["status"]; suspendedReason?: string }
  > {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, status, suspendedReason }) => {
        const existing = await idTable.get(id);
        if (!existing) {
          throw new Error("Không tìm thấy hồ sơ để cập nhật trạng thái.");
        }
        const updated: T = {
          ...existing,
          status,
          suspendedReason: status === "suspended" ? suspendedReason : undefined,
          updatedAt: Date.now(),
        };
        await table.put(updated);
        return updated;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey, "list"] });
      },
    });
  }

  return { useList, useEntity, useCreate, useUpdate, useRemove, useSetStatus };
}

/** Ném ra khi xoá bị chặn bởi ràng buộc nghiệp vụ — UI bắt lỗi này để hiện lý do cụ thể. */
export class DeleteGuardError extends Error {
  blockers: string[];

  constructor(guard: DeleteGuardResult) {
    super(guard.blockers.join(" "));
    this.name = "DeleteGuardError";
    this.blockers = guard.blockers;
  }
}
