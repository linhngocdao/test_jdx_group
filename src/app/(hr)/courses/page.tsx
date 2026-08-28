"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
} from "@/components/data-table";
import { DeleteEntityDialog } from "@/components/entity-form";
import { useDataTableInstance, useDataTableState } from "@/hooks/use-data-table";
import { useCourseListWithNames, useRemoveCourse, type CourseWithNames } from "@/hooks/use-courses";

import { createCourseColumns } from "./columns";
import { CourseFormDialog } from "./course-form-dialog";

type DialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; course: CourseWithNames }
  | { type: "delete"; course: CourseWithNames };

export default function CoursesPage() {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const removeMutation = useRemoveCourse();
  const tableState = useDataTableState({ initialPageSize: 20 });

  const listQuery = useCourseListWithNames({
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    search: tableState.debouncedSearch,
    sortBy: tableState.sorting[0]?.id,
    sortDir: tableState.sorting[0]?.desc ? "desc" : "asc",
  });

  const rows = useMemo(() => listQuery.data?.rows ?? [], [listQuery.data]);
  const total = listQuery.data?.total ?? 0;

  const findRow = useCallback((id: string) => rows.find((row) => row.id === id), [rows]);

  const columns = useMemo(
    () =>
      createCourseColumns({
        onView: (id) => router.push(`/courses/${id}`),
        onEdit: (id) => {
          const course = findRow(id);
          if (course) setDialog({ type: "edit", course });
        },
        onDelete: (id) => {
          const course = findRow(id);
          if (course) setDialog({ type: "delete", course });
        },
      }),
    [findRow, router]
  );

  const table = useDataTableInstance<CourseWithNames>({
    columns,
    data: rows,
    rowCount: total,
    state: tableState,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Quản lý khoá học</h1>
        <p className="text-sm text-muted-foreground">
          Tạo khoá học, gán giảng viên/phòng học và theo dõi vòng đời từ nháp đến kết thúc.
        </p>
      </div>

      <DataTableToolbar
        search={tableState.search}
        onSearchChange={tableState.setSearch}
        searchPlaceholder="Tìm theo tên khoá học..."
        actions={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-4" />
            Tạo khoá học
          </Button>
        }
      />

      <DataTable
        table={table}
        columns={columns}
        data={rows}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        onRowClick={(course) => router.push(`/courses/${course.id}`)}
      />

      <DataTablePagination
        pageIndex={tableState.pageIndex}
        pageSize={tableState.pageSize}
        total={total}
        onPageIndexChange={(pageIndex) => tableState.setPagination(pageIndex, tableState.pageSize)}
        onPageSizeChange={(pageSize) => tableState.setPagination(0, pageSize)}
      />

      <CourseFormDialog
        open={dialog.type === "create" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        mode={dialog.type === "edit" ? "edit" : "create"}
        courseId={dialog.type === "edit" ? dialog.course.id : null}
      />

      <DeleteEntityDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "delete" ? dialog.course.name : ""}
        onConfirm={async () => {
          if (dialog.type === "delete") {
            await removeMutation.mutateAsync(dialog.course.id);
          }
        }}
      />
    </div>
  );
}
