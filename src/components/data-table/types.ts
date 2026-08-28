import type { ReactNode } from "react";
import type { ColumnDef, Table } from "@tanstack/react-table";

export interface DataTableColumnMeta {
  /** Độ rộng cột (css width). */
  width?: string;
  /** Ẩn cột này ở màn hình nhỏ, chỉ hiện trên md trở lên. */
  hideOnMobile?: boolean;
  align?: "left" | "center" | "right";
}

export type DataTableColumnDef<T> = ColumnDef<T, unknown> & {
  meta?: DataTableColumnMeta;
};

export interface DataTableProps<T> {
  table: Table<T>;
  columns: DataTableColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  isFetching?: boolean;
  /** Chiều cao mỗi dòng (px) — dùng cho virtualization. */
  rowHeight?: number;
  /** Ngưỡng số dòng để bật virtualization, mặc định 30. */
  virtualizationThreshold?: number;
  /** Chiều cao tối đa vùng scroll của bảng. */
  maxHeight?: number;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
}
