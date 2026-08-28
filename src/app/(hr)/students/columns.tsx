"use client";

import { MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { Student } from "@/types/student";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(epochMs: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

interface StudentColumnActions {
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onToggleSuspend: (student: Student) => void;
}

export function createStudentColumns({
  onEdit,
  onDelete,
  onToggleSuspend,
}: StudentColumnActions): DataTableColumnDef<Student>[] {
  return [
    {
      id: "fullName",
      accessorKey: "fullName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Học viên" />,
      meta: { width: "30%" },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">
              {getInitials(row.original.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.fullName}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: "Điện thoại",
      meta: { hideOnMobile: true, width: "16%" },
    },
    {
      id: "dateOfBirth",
      accessorKey: "dateOfBirth",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày sinh" />,
      meta: { hideOnMobile: true, width: "16%" },
      cell: ({ row }) => formatDate(row.original.dateOfBirth),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Trạng thái",
      meta: { width: "16%" },
      cell: ({ row }) => <EntityStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      meta: { width: "60px", align: "right" },
      cell: ({ row }) => {
        const student = row.original;
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
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Pencil className="size-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleSuspend(student)}>
                {student.status === "active" ? (
                  <>
                    <UserX className="size-4" /> Bảo lưu
                  </>
                ) : (
                  <>
                    <UserCheck className="size-4" /> Kích hoạt lại
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(student)}>
                <Trash2 className="size-4" /> Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
