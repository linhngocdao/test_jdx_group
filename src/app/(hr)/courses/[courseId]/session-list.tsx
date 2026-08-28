"use client";

import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCourseSessions, useRemoveClassSession } from "@/hooks/use-class-sessions";

function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(epochMs);
}

export function SessionList({
  courseId,
  onAddSession,
}: {
  courseId: string;
  onAddSession: () => void;
}) {
  const { data: sessions, isLoading } = useCourseSessions(courseId);
  const removeSession = useRemoveClassSession();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Lịch các buổi học</h2>
        <Button size="sm" variant="outline" onClick={onAddSession}>
          <CalendarPlus className="size-4" />
          Thêm buổi học
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!isLoading && (sessions?.length ?? 0) === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Chưa có buổi học nào được lên lịch.
        </p>
      )}

      {(sessions?.length ?? 0) > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Số học viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {formatDateTime(session.startAt)} – {formatDateTime(session.endAt)}
                  </TableCell>
                  <TableCell>{session.studentIds.length}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {session.isFinished ? "Đã diễn ra" : "Sắp diễn ra"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        removeSession.mutate(session.id, {
                          onSuccess: () => toast.success("Đã xoá buổi học."),
                          onError: () => toast.error("Không thể xoá buổi học."),
                        });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
