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
import { useExportTeacherSchedule } from "@/hooks/use-export";
import { useActiveSpecialties } from "@/hooks/use-specialties";
import {
  useRemoveTeacher,
  useSetTeacherStatus,
  useTeacherList,
} from "@/hooks/use-teachers";
import type { Teacher } from "@/types/teacher";

import { createTeacherColumns } from "./columns";
import { TeacherFormDialog } from "./teacher-form-dialog";

type DialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; teacher: Teacher }
  | { type: "delete"; teacher: Teacher }
  | { type: "suspend"; teacher: Teacher };

export default function TeachersPage() {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const removeMutation = useRemoveTeacher();
  const setStatusMutation = useSetTeacherStatus();
  const exportSchedule = useExportTeacherSchedule();
  const { data: specialties } = useActiveSpecialties();
  const specialtyNameById = useMemo(
    () => new Map((specialties ?? []).map((s) => [s.id, s.name])),
    [specialties]
  );

  const tableState = useDataTableState({ initialPageSize: 20 });

  const listQuery = useTeacherList({
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    search: tableState.debouncedSearch,
    sortBy: tableState.sorting[0]?.id,
    sortDir: tableState.sorting[0]?.desc ? "desc" : "asc",
  });

  const rows = useMemo(() => listQuery.data?.rows ?? [], [listQuery.data]);
  const total = listQuery.data?.total ?? 0;

  // Callback nhận thẳng object Teacher (đã có sẵn trong cell renderer qua
  // `row.original`) thay vì `id` + tra cứu lại trong `rows` — nhờ vậy
  // `columns` không phụ thuộc `rows`, không phải re-tạo mỗi khi trang dữ
  // liệu đổi, và TanStack Table không phải rebuild toàn bộ column model.
  const columns = useMemo(
    () =>
      createTeacherColumns({
        onEdit: (teacher) => setDialog({ type: "edit", teacher }),
        onDelete: (teacher) => setDialog({ type: "delete", teacher }),
        onToggleSuspend: (teacher) => {
          if (teacher.status === "active") {
            setDialog({ type: "suspend", teacher });
          } else {
            setStatusMutation.mutate(
              { id: teacher.id, status: "active" },
              {
                onSuccess: () => toast.success(`Đã kích hoạt lại "${teacher.fullName}".`),
                onError: () => toast.error("Không thể cập nhật trạng thái."),
              }
            );
          }
        },
        onExportSchedule: (teacher) => {
          exportSchedule.mutate(teacher.id, {
            onSuccess: () => toast.success("Đã xuất lịch dạy."),
            onError: () => toast.error("Không thể xuất file."),
          });
        },
        specialtyNameById,
      }),
    [setStatusMutation, exportSchedule, specialtyNameById]
  );

  const table = useDataTableInstance<Teacher>({
    columns,
    data: rows,
    rowCount: total,
    state: tableState,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Quản lý giảng viên</h1>
        <p className="text-sm text-muted-foreground">
          CRUD, tìm kiếm và theo dõi tải giảng dạy của giảng viên trong trung tâm.
        </p>
      </div>

      <DataTableToolbar
        search={tableState.search}
        onSearchChange={tableState.setSearch}
        searchPlaceholder="Tìm theo tên, email, số điện thoại..."
        actions={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-4" />
            Thêm giảng viên
          </Button>
        }
      />

      <DataTable
        table={table}
        columns={columns}
        data={rows}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        onRowClick={(teacher) => router.push(`/teachers/${teacher.id}`)}
      />

      <DataTablePagination
        pageIndex={tableState.pageIndex}
        pageSize={tableState.pageSize}
        total={total}
        onPageIndexChange={(pageIndex) => tableState.setPagination(pageIndex, tableState.pageSize)}
        onPageSizeChange={(pageSize) => tableState.setPagination(0, pageSize)}
      />

      <TeacherFormDialog
        open={dialog.type === "create" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        mode={dialog.type === "edit" ? "edit" : "create"}
        teacherId={dialog.type === "edit" ? dialog.teacher.id : null}
      />

      <DeleteEntityDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "delete" ? dialog.teacher.fullName : ""}
        onConfirm={async () => {
          if (dialog.type === "delete") {
            await removeMutation.mutateAsync(dialog.teacher.id);
          }
        }}
      />

      <SuspendEntityDialog
        open={dialog.type === "suspend"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "suspend" ? dialog.teacher.fullName : ""}
        reasonPlaceholder="Vd: giảng viên nghỉ dài hạn..."
        onConfirm={async (reason) => {
          if (dialog.type === "suspend") {
            await setStatusMutation.mutateAsync({
              id: dialog.teacher.id,
              status: "suspended",
              suspendedReason: reason,
            });
          }
        }}
      />
    </div>
  );
}
