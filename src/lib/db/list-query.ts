import type { EntityTable } from "dexie";

import type { ListQueryParams, PaginatedResult } from "@/types/entity";

/** Độ trễ giả lập network để hook loading/skeleton có ý nghĩa dù chạy hoàn toàn local. */
const SIMULATED_LATENCY_MS = 150;

export function simulateLatency(ms = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chạy search (client-side, không dấu) + sort + phân trang trên một Dexie table.
 * Dùng chung cho mọi module (giảng viên/học viên/phòng học/khoá học...) để
 * không lặp logic lọc/sắp xếp/cắt trang ở từng nơi. Chỉ yêu cầu `T` có `id`
 * dạng string — không ràng buộc `BaseEntity` vì không phải entity nào (vd.
 * Course) cũng có field `status` của BaseEntity.
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

  let rows = await table.toArray();

  if (search?.trim()) {
    const needle = normalizeSearchText(search);
    rows = rows.filter((row) =>
      searchableFields.some((field) => {
        const value = row[field];
        return typeof value === "string" && normalizeSearchText(value).includes(needle);
      })
    );
  }

  if (sortBy) {
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const aValue = a[sortBy as keyof T];
      const bValue = b[sortBy as keyof T];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * dir;
      }
      return String(aValue ?? "").localeCompare(String(bValue ?? "")) * dir;
    });
  }

  const total = rows.length;
  const start = pageIndex * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return { rows: pageRows, total, pageIndex, pageSize };
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
