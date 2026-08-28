"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader, type DataTableColumnDef } from "@/components/data-table";
import type { CourseWithNames } from "@/hooks/use-courses";

import { CourseStatusBadge } from "./course-status-badge";

function formatDate(epochMs: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

interface CourseColumnActions {
  onView: (course: CourseWithNames) => void;
  onEdit: (course: CourseWithNames) => void;
  onDelete: (course: CourseWithNames) => void;
}

export function createCourseColumns({
  onView,
  onEdit,
  onDelete,
}: CourseColumnActions): DataTableColumnDef<CourseWithNames>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Khoá học" />,
      meta: { width: "24%" },
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "teacherName",
      accessorKey: "teacherName",
      header: "Giảng viên",
      meta: { width: "16%" },
    },
    {
      id: "roomName",
      accessorKey: "roomName",
      header: "Phòng học",
      meta: { hideOnMobile: true, width: "12%" },
    },
    {
      id: "enrollment",
      header: "Đăng ký",
      meta: { hideOnMobile: true, width: "12%" },
      cell: ({ row }) => {
        const { confirmedCount, minStudents, maxStudents, courseStatus } = row.original;
        // Cảnh báo "chưa đủ tối thiểu" chỉ còn ý nghĩa khi khoá còn có thể bị ảnh hưởng
        // bởi số lượng (draft/open/ongoing) — khoá đã finished/cancelled thì bỏ qua.
        const underMin =
          confirmedCount < minStudents && (courseStatus === "open" || courseStatus === "draft");
        return (
          <span className={underMin ? "font-medium text-amber-600" : undefined}>
            {confirmedCount}/{maxStudents}
            {underMin && ` (cần ≥${minStudents})`}
          </span>
        );
      },
    },
    {
      id: "startDate",
      accessorKey: "startDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Khai giảng" />,
      meta: { width: "14%" },
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      id: "courseStatus",
      accessorKey: "courseStatus",
      header: "Trạng thái",
      meta: { width: "14%" },
      cell: ({ row }) => <CourseStatusBadge status={row.original.courseStatus} />,
    },
    {
      id: "actions",
      header: "",
      meta: { width: "60px", align: "right" },
      cell: ({ row }) => {
        const course = row.original;
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
              <DropdownMenuItem onClick={() => onView(course)}>Xem chi tiết</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Pencil className="size-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(course)}>
                <Trash2 className="size-4" /> Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
