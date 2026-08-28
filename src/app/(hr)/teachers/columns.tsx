"use client";

import { Download, MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { Teacher, TeacherSpecialty } from "@/types/teacher";

const SPECIALTY_LABELS: Record<TeacherSpecialty, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  data: "Data",
  design: "Design",
  other: "Khác",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

interface TeacherColumnActions {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSuspend: (id: string, isSuspended: boolean) => void;
  onExportSchedule: (id: string) => void;
}

export function createTeacherColumns({
  onEdit,
  onDelete,
  onToggleSuspend,
  onExportSchedule,
}: TeacherColumnActions): DataTableColumnDef<Teacher>[] {
  return [
    {
      id: "fullName",
      accessorKey: "fullName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Giảng viên" />,
      meta: { width: "26%" },
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
      meta: { hideOnMobile: true, width: "14%" },
    },
    {
      id: "specialty",
      accessorKey: "specialty",
      header: "Chuyên môn",
      meta: { hideOnMobile: true, width: "14%" },
      cell: ({ row }) => <Badge variant="secondary">{SPECIALTY_LABELS[row.original.specialty]}</Badge>,
    },
    {
      id: "weeklySessionLoad",
      accessorKey: "weeklySessionLoad",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Buổi/tuần" className="justify-end" />
      ),
      meta: { align: "right", width: "12%" },
      cell: ({ row }) => {
        const load = row.original.weeklySessionLoad;
        const isOverloaded = load > 10;
        return (
          <span className={isOverloaded ? "font-semibold text-amber-600" : undefined}>
            {load}
            {isOverloaded && " ⚠"}
          </span>
        );
      },
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
        const teacher = row.original;
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
              <DropdownMenuItem onClick={() => onEdit(teacher.id)}>
                <Pencil className="size-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportSchedule(teacher.id)}>
                <Download className="size-4" /> Xuất lịch dạy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleSuspend(teacher.id, teacher.status === "active")}
              >
                {teacher.status === "active" ? (
                  <>
                    <UserX className="size-4" /> Tạm ngưng
                  </>
                ) : (
                  <>
                    <UserCheck className="size-4" /> Kích hoạt lại
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(teacher.id)}>
                <Trash2 className="size-4" /> Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
