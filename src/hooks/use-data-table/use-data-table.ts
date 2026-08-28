import { useEffect, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
  type Table,
} from "@tanstack/react-table";

import { useDebounce } from "@/hooks/use-debounce";

import type {
  UseDataTableInstanceOptions,
  UseDataTableStateOptions,
  UseDataTableStateReturn,
} from "./types";

/**
 * Bước 1: state điều khiển bảng — search (debounced), sort, phân trang, row
 * selection. Gọi hook này *trước* khi query dữ liệu (React Query), vì
 * pageIndex/pageSize/search/sortBy là tham số của query đó.
 */
export function useDataTableState({
  initialPageSize = 20,
}: UseDataTableStateOptions = {}): UseDataTableStateReturn {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const debouncedSearch = useDebounce(search, 300);

  // Search/sort đổi thì luôn quay về trang đầu, tránh trang rỗng "ma".
  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearch, sorting]);

  return {
    pageIndex,
    pageSize,
    search,
    setSearch,
    debouncedSearch,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    setPagination: (nextPageIndex, nextPageSize) => {
      setPageIndex(nextPageIndex);
      setPageSize(nextPageSize);
    },
  };
}

/**
 * Bước 2: tạo TanStack Table instance từ `data`/`rowCount` đã được query về
 * (Dexie/React Query) cho state ở bước 1. Tách riêng để component có thể gọi
 * `useDataTableState` → query dữ liệu → rồi mới tạo table, thay vì phải "vá"
 * table instance sau khi data về (dễ gây warning/inconsistency).
 */
export function useDataTableInstance<T>({
  columns,
  data,
  rowCount,
  state,
  enableRowSelection = false,
  getRowId,
}: UseDataTableInstanceOptions<T>): Table<T> {
  const { pageIndex, pageSize, sorting, rowSelection, setPagination, setSorting, setRowSelection } =
    state;

  return useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection,
    rowCount,
    getRowId,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      rowSelection,
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPagination(next.pageIndex, next.pageSize);
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });
}
