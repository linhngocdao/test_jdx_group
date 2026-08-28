"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
} from "@/components/data-table";
import { DeleteEntityDialog, SuspendEntityDialog } from "@/components/entity-form";
import { useDataTableInstance, useDataTableState } from "@/hooks/use-data-table";
import {
  useRemoveStudent,
  useSetStudentStatus,
  useStudentList,
} from "@/hooks/use-students";
import type { Student } from "@/types/student";

import { createStudentColumns } from "./columns";
import { StudentFormDialog } from "./student-form-dialog";

type DialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; student: Student }
  | { type: "delete"; student: Student }
  | { type: "suspend"; student: Student };

export default function StudentsPage() {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const removeMutation = useRemoveStudent();
  const setStatusMutation = useSetStudentStatus();

  const tableState = useDataTableState({ initialPageSize: 20 });

  const listQuery = useStudentList({
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    search: tableState.debouncedSearch,
    sortBy: tableState.sorting[0]?.id,
    sortDir: tableState.sorting[0]?.desc ? "desc" : "asc",
  });

  const rows = useMemo(() => listQuery.data?.rows ?? [], [listQuery.data]);
  const total = listQuery.data?.total ?? 0;

  // Callback nhận thẳng object Student (đã có sẵn trong cell renderer) thay
  // vì `id` + tra cứu lại trong `rows` — nhờ vậy `columns` không phụ thuộc
  // `rows`, không phải re-tạo mỗi khi trang dữ liệu đổi.
  const columns = useMemo(
    () =>
      createStudentColumns({
        onEdit: (student) => setDialog({ type: "edit", student }),
        onDelete: (student) => setDialog({ type: "delete", student }),
        onToggleSuspend: (student) => {
          if (student.status === "active") {
            setDialog({ type: "suspend", student });
          } else {
            setStatusMutation.mutate(
              { id: student.id, status: "active" },
              {
                onSuccess: () => toast.success(`Đã kích hoạt lại "${student.fullName}".`),
                onError: () => toast.error("Không thể cập nhật trạng thái."),
              }
            );
          }
        },
      }),
    [setStatusMutation]
  );

  const table = useDataTableInstance<Student>({
    columns,
    data: rows,
    rowCount: total,
    state: tableState,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Quản lý học viên</h1>
        <p className="text-sm text-muted-foreground">
          CRUD, tìm kiếm và theo dõi trạng thái bảo lưu của học viên.
        </p>
      </div>

      <DataTableToolbar
        search={tableState.search}
        onSearchChange={tableState.setSearch}
        searchPlaceholder="Tìm theo tên, email, số điện thoại..."
        actions={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-4" />
            Thêm học viên
          </Button>
        }
      />

      <DataTable
        table={table}
        columns={columns}
        data={rows}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        onRowClick={(student) => router.push(`/students/${student.id}`)}
      />

      <DataTablePagination
        pageIndex={tableState.pageIndex}
        pageSize={tableState.pageSize}
        total={total}
        onPageIndexChange={(pageIndex) => tableState.setPagination(pageIndex, tableState.pageSize)}
        onPageSizeChange={(pageSize) => tableState.setPagination(0, pageSize)}
      />

      <StudentFormDialog
        open={dialog.type === "create" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        mode={dialog.type === "edit" ? "edit" : "create"}
        studentId={dialog.type === "edit" ? dialog.student.id : null}
      />

      <DeleteEntityDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "delete" ? dialog.student.fullName : ""}
        onConfirm={async () => {
          if (dialog.type === "delete") {
            await removeMutation.mutateAsync(dialog.student.id);
          }
        }}
      />

      <SuspendEntityDialog
        open={dialog.type === "suspend"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "suspend" ? dialog.student.fullName : ""}
        reasonPlaceholder="Vd: học viên bảo lưu..."
        onConfirm={async (reason) => {
          if (dialog.type === "suspend") {
            await setStatusMutation.mutateAsync({
              id: dialog.student.id,
              status: "suspended",
              suspendedReason: reason,
            });
          }
        }}
      />
    </div>
  );
}
