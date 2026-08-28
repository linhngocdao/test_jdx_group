"use client";

import Link from "next/link";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionStudents } from "@/hooks/use-class-sessions";
import type { ClassSession } from "@/types/class-session";

interface SessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  teacherName?: string;
  roomName?: string;
}

function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(epochMs);
}

/** Xem chi tiết 1 buổi học cụ thể — giờ giấc, giảng viên/phòng, và danh sách học viên tham gia. */
export function SessionDetailDialog({
  open,
  onOpenChange,
  session,
  teacherName,
  roomName,
}: SessionDetailDialogProps) {
  const { data: students, isLoading } = useSessionStudents(session?.studentIds);

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {session.courseName}
            <Badge variant="outline">{session.isFinished ? "Đã diễn ra" : "Sắp diễn ra"}</Badge>
          </DialogTitle>
          <DialogDescription>
            {formatDateTime(session.startAt)} – {formatDateTime(session.endAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {teacherName && (
            <span>
              Giảng viên: <span className="font-medium text-foreground">{teacherName}</span>
            </span>
          )}
          {roomName && (
            <span>
              Phòng: <span className="font-medium text-foreground">{roomName}</span>
            </span>
          )}
          <Link href={`/courses/${session.courseId}`} className="text-foreground hover:underline">
            Xem khoá học →
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Users className="size-4" />
            Học viên tham gia ({session.studentIds.length})
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

          {!isLoading && session.studentIds.length === 0 && (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Chưa có học viên nào được gán vào buổi học này.
            </p>
          )}

          {!isLoading && (students?.length ?? 0) > 0 && (
            <ScrollArea className="h-52 rounded-md border">
              <div className="divide-y">
                {students?.map((student) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex flex-col px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium">{student.fullName}</span>
                    {student.email && (
                      <span className="text-xs text-muted-foreground">{student.email}</span>
                    )}
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
