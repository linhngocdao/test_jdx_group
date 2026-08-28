"use client";

import { useRef } from "react";
import { flexRender } from "@tanstack/react-table";

import { useVirtualizedRows } from "@/hooks/use-virtualized-rows";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTableEmpty } from "./data-table-empty";
import { DataTableSkeleton } from "./data-table-skeleton";
import type { DataTableColumnMeta, DataTableProps } from "./types";

const DEFAULT_ROW_HEIGHT = 48;

/**
 * Bảng dữ liệu dùng chung cho toàn app: search/sort/pagination được điều
 * khiển từ ngoài qua `useDataTable`, ở đây chỉ lo phần render — kể cả
 * virtualization khi dữ liệu lớn (hàng trăm nghìn bản ghi vẫn mượt vì chỉ
 * các dòng trong viewport được đưa vào DOM).
 */
export function DataTable<T>({
  table,
  data,
  isLoading = false,
  isFetching = false,
  rowHeight = DEFAULT_ROW_HEIGHT,
  virtualizationThreshold = 30,
  maxHeight = 560,
  emptyState,
  onRowClick,
}: DataTableProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const { isVirtualized, virtualItems, totalSize } = useVirtualizedRows({
    count: rows.length,
    scrollContainerRef,
    rowHeight,
    threshold: virtualizationThreshold,
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={table.getAllLeafColumns().length} />;
  }

  if (!isLoading && data.length === 0) {
    return emptyState ?? <DataTableEmpty />;
  }

  const paddingTop = isVirtualized && virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    isVirtualized && virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1].end
      : 0;

  const visibleRows = isVirtualized
    ? virtualItems.map((virtualRow) => rows[virtualRow.index])
    : rows;

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "relative w-full overflow-auto rounded-md border",
        isFetching && "opacity-60 transition-opacity"
      )}
      style={{ maxHeight }}
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as
                  | DataTableColumnMeta
                  | undefined;
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: meta?.width }}
                    className={cn(
                      meta?.align === "right" && "text-right",
                      meta?.align === "center" && "text-center",
                      meta?.hideOnMobile && "hidden md:table-cell"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <TableRow style={{ height: paddingTop }} aria-hidden>
              <TableCell colSpan={table.getAllLeafColumns().length} className="p-0" />
            </TableRow>
          )}
          {visibleRows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as
                  | DataTableColumnMeta
                  | undefined;
                return (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      meta?.align === "right" && "text-right",
                      meta?.align === "center" && "text-center",
                      meta?.hideOnMobile && "hidden md:table-cell"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {paddingBottom > 0 && (
            <TableRow style={{ height: paddingBottom }} aria-hidden>
              <TableCell colSpan={table.getAllLeafColumns().length} className="p-0" />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
