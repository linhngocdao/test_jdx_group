"use client";

import { MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader, type DataTableColumnDef } from "@/components/data-table";
import { EntityStatusBadge } from "@/components/entity-form";
import type { Room, RoomEquipment } from "@/types/room";

const EQUIPMENT_LABELS: Record<RoomEquipment, string> = {
  projector: "Máy chiếu",
  whiteboard: "Bảng trắng",
  computers: "Máy tính",
  ac: "Điều hoà",
};

interface RoomColumnActions {
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onToggleSuspend: (room: Room) => void;
}

export function createRoomColumns({
  onEdit,
  onDelete,
  onToggleSuspend,
}: RoomColumnActions): DataTableColumnDef<Room>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phòng học" />,
      meta: { width: "18%" },
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "building",
      accessorKey: "building",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Toà nhà" />,
      meta: { width: "16%" },
    },
    {
      id: "capacity",
      accessorKey: "capacity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sức chứa" className="justify-end" />
      ),
      meta: { align: "right", width: "12%" },
    },
    {
      id: "equipment",
      header: "Trang thiết bị",
      meta: { hideOnMobile: true, width: "26%" },
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.equipment.length === 0 && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {row.original.equipment.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {EQUIPMENT_LABELS[item]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Trạng thái",
      meta: { width: "14%" },
      cell: ({ row }) => <EntityStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      meta: { width: "60px", align: "right" },
      cell: ({ row }) => {
        const room = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(room)}>
                <Pencil className="size-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleSuspend(room)}>
                {room.status === "active" ? (
                  <>
                    <UserX className="size-4" /> Đang sửa chữa
                  </>
                ) : (
                  <>
                    <UserCheck className="size-4" /> Kích hoạt lại
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(room)}>
                <Trash2 className="size-4" /> Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
