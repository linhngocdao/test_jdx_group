import type {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  Table,
} from "@tanstack/react-table";

export interface UseDataTableStateOptions {
  initialPageSize?: number;
}

/**
 * State điều khiển bảng (search/sort/pagination), tách khỏi việc tạo table
 * instance vì ở các bảng server/Dexie-side, ta cần các giá trị này *trước*
 * khi gọi query danh sách — rồi mới có `data`/`rowCount` thực để tạo
 * `useReactTable`.
 */
export interface UseDataTableStateReturn {
  pageIndex: number;
  pageSize: number;
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;
  setPagination: (pageIndex: number, pageSize: number) => void;
}

export interface UseDataTableInstanceOptions<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  rowCount: number;
  state: UseDataTableStateReturn;
  enableRowSelection?: boolean;
  getRowId?: (row: T) => string;
}
