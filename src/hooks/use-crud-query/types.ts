import type { EntityTable } from "dexie";

import type {
  BaseEntity,
  DeleteGuardResult,
  ListQueryParams,
  PaginatedResult,
} from "@/types/entity";

export interface CrudResourceConfig<T extends BaseEntity, TInput> {
  /** Khoá dùng cho React Query cache (vd. "teachers"). */
  queryKey: string;
  /** Dexie table tương ứng. */
  table: EntityTable<T, "id">;
  /** Các field text được phép tìm kiếm. */
  searchableFields: (keyof T)[];
  /** Sinh field mặc định (id, timestamps, avatarSeed...) khi tạo mới. */
  buildNewEntity: (input: TInput) => T;
  /** Áp field chỉnh sửa lên entity hiện có (giữ nguyên id/createdAt). */
  applyUpdate: (existing: T, input: TInput) => T;
  /**
   * Kiểm tra ràng buộc trước khi xoá — vd. giảng viên/phòng học đang gán
   * cho buổi học chưa kết thúc thì không được xoá.
   */
  checkDeleteGuard?: (entity: T) => Promise<DeleteGuardResult>;
}

export interface ListQueryResult<T> extends PaginatedResult<T> {}

export type { ListQueryParams };
