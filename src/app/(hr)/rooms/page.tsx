"use client";

import { useCallback, useMemo, useState } from "react";
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
import { useRemoveRoom, useRoomList, useSetRoomStatus } from "@/hooks/use-rooms";
import type { Room } from "@/types/room";

import { createRoomColumns } from "./columns";
import { RoomFormDialog } from "./room-form-dialog";

type DialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; room: Room }
  | { type: "delete"; room: Room }
  | { type: "suspend"; room: Room };

export default function RoomsPage() {
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const removeMutation = useRemoveRoom();
  const setStatusMutation = useSetRoomStatus();

  const tableState = useDataTableState({ initialPageSize: 20 });

  const listQuery = useRoomList({
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
      createRoomColumns({
        onEdit: (id) => {
          const room = findRow(id);
          if (room) setDialog({ type: "edit", room });
        },
        onDelete: (id) => {
          const room = findRow(id);
          if (room) setDialog({ type: "delete", room });
        },
        onToggleSuspend: (id, isSuspended) => {
          const room = findRow(id);
          if (!room) return;
          if (isSuspended) {
            setDialog({ type: "suspend", room });
          } else {
            setStatusMutation.mutate(
              { id, status: "active" },
              {
                onSuccess: () => toast.success(`Đã kích hoạt lại "${room.name}".`),
                onError: () => toast.error("Không thể cập nhật trạng thái."),
              }
            );
          }
        },
      }),
    [findRow, setStatusMutation]
  );

  const table = useDataTableInstance<Room>({
    columns,
    data: rows,
    rowCount: total,
    state: tableState,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Quản lý phòng học</h1>
        <p className="text-sm text-muted-foreground">
          CRUD, tìm kiếm và theo dõi trạng thái sửa chữa của phòng học.
        </p>
      </div>

      <DataTableToolbar
        search={tableState.search}
        onSearchChange={tableState.setSearch}
        searchPlaceholder="Tìm theo tên phòng, toà nhà..."
        actions={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-4" />
            Thêm phòng học
          </Button>
        }
      />

      <DataTable
        table={table}
        columns={columns}
        data={rows}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        onRowClick={(room) => setDialog({ type: "edit", room })}
      />

      <DataTablePagination
        pageIndex={tableState.pageIndex}
        pageSize={tableState.pageSize}
        total={total}
        onPageIndexChange={(pageIndex) => tableState.setPagination(pageIndex, tableState.pageSize)}
        onPageSizeChange={(pageSize) => tableState.setPagination(0, pageSize)}
      />

      <RoomFormDialog
        open={dialog.type === "create" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        mode={dialog.type === "edit" ? "edit" : "create"}
        roomId={dialog.type === "edit" ? dialog.room.id : null}
      />

      <DeleteEntityDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "delete" ? dialog.room.name : ""}
        onConfirm={async () => {
          if (dialog.type === "delete") {
            await removeMutation.mutateAsync(dialog.room.id);
          }
        }}
      />

      <SuspendEntityDialog
        open={dialog.type === "suspend"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "suspend" ? dialog.room.name : ""}
        reasonPlaceholder="Vd: phòng đang sửa chữa..."
        onConfirm={async (reason) => {
          if (dialog.type === "suspend") {
            await setStatusMutation.mutateAsync({
              id: dialog.room.id,
              status: "suspended",
              suspendedReason: reason,
            });
          }
        }}
      />
    </div>
  );
}
