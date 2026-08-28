import type { EntityTable } from "dexie";

import type { ListQueryParams, PaginatedResult } from "@/types/entity";

/** Độ trễ giả lập network để hook loading/skeleton có ý nghĩa dù chạy hoàn toàn local. */
const SIMULATED_LATENCY_MS = 150;

export function simulateLatency(ms = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Dùng chung cho mọi nơi cần so khớp text không phân biệt dấu tiếng Việt (search, combobox...). */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Chạy search (client-side, không dấu) + sort + phân trang trên một Dexie table.
 * Dùng chung cho mọi module (giảng viên/học viên/phòng học/khoá học...) để
 * không lặp logic lọc/sắp xếp/cắt trang ở từng nơi. Chỉ yêu cầu `T` có `id`
 * dạng string — không ràng buộc `BaseEntity` vì không phải entity nào (vd.
 * Course) cũng có field `status` của BaseEntity.
 *
 * Hai đường xử lý khác nhau tuỳ có search hay không:
 * - Không search (phần lớn lượt xem: mở trang, đổi trang, đổi cột sort): đi
 *   qua Dexie index (`orderBy`/`offset`/`limit`) — không bao giờ tải quá 1
 *   trang dữ liệu vào bộ nhớ, kể cả bảng có hàng trăm nghìn bản ghi.
 * - Có search: bắt buộc phải quét vì so khớp "không phân biệt dấu" không thể
 *   biểu diễn bằng index B-tree của IndexedDB (dữ liệu lưu có dấu). Đường
 *   này vẫn là fallback, không phải đường mặc định.
 */
export async function queryPaginatedTable<T extends { id: string }>(
  table: EntityTable<T, "id">,
  params: ListQueryParams,
  options: {
    searchableFields: (keyof T)[];
  }
): Promise<PaginatedResult<T>> {
  await simulateLatency();

  const { pageIndex, pageSize, search, sortBy, sortDir = "asc" } = params;
  const { searchableFields } = options;
  const start = pageIndex * pageSize;

  if (!search?.trim()) {
    return queryWithoutSearch(table, { pageIndex, pageSize, sortBy, sortDir, start });
  }

  return queryWithSearch(table, {
    pageIndex,
    pageSize,
    search,
    sortBy,
    sortDir,
    start,
    searchableFields,
  });
}

/** Không có search: đi qua index Dexie, không tải quá 1 trang vào bộ nhớ. */
async function queryWithoutSearch<T extends { id: string }>(
  table: EntityTable<T, "id">,
  {
    pageIndex,
    pageSize,
    sortBy,
    sortDir,
    start,
  }: { pageIndex: number; pageSize: number; sortBy?: string; sortDir: "asc" | "desc"; start: number }
): Promise<PaginatedResult<T>> {
  const total = await table.count();

  const isIndexed = sortBy ? table.schema.idxByName[sortBy] !== undefined : false;

  let collection = isIndexed && sortBy ? table.orderBy(sortBy) : table.toCollection();
  if (isIndexed && sortDir === "desc") {
    collection = collection.reverse();
  }

  let rows = await collection.offset(start).limit(pageSize).toArray();

  // sortBy không có index (vd. field tính toán) — chỉ còn cách sort trong bộ
  // nhớ, nhưng vẫn giới hạn ở quy mô 1 trang nên chi phí không đáng kể.
  if (sortBy && !isIndexed) {
    const dir = sortDir === "desc" ? -1 : 1;
    const all = await table.toArray();
    rows = sortRows(all, sortBy as keyof T, dir).slice(start, start + pageSize);
  }

  return { rows, total, pageIndex, pageSize };
}

/** Có search: quét toàn bảng (không tránh được vì so khớp không dấu), sort + cắt trang trong bộ nhớ. */
async function queryWithSearch<T extends { id: string }>(
  table: EntityTable<T, "id">,
  {
    pageIndex,
    pageSize,
    search,
    sortBy,
    sortDir,
    start,
    searchableFields,
  }: {
    pageIndex: number;
    pageSize: number;
    search: string;
    sortBy?: string;
    sortDir: "asc" | "desc";
    start: number;
    searchableFields: (keyof T)[];
  }
): Promise<PaginatedResult<T>> {
  const needle = normalizeSearchText(search);

  const matched = await table
    .filter((row) =>
      searchableFields.some((field) => {
        const value = row[field];
        return typeof value === "string" && normalizeSearchText(value).includes(needle);
      })
    )
    .toArray();

  const sorted = sortBy
    ? sortRows(matched, sortBy as keyof T, sortDir === "desc" ? -1 : 1)
    : matched;

  const total = sorted.length;
  const rows = sorted.slice(start, start + pageSize);

  return { rows, total, pageIndex, pageSize };
}

function sortRows<T>(rows: T[], sortBy: keyof T, dir: 1 | -1): T[] {
  return [...rows].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * dir;
    }
    return String(aValue ?? "").localeCompare(String(bValue ?? "")) * dir;
  });
}
