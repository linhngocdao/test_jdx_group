"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateClassSession } from "@/hooks/use-class-sessions";
import { ScheduleConflictError } from "@/lib/scheduling/conflict-detection";
import type { Course } from "@/types/course";

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  confirmedStudentIds: string[];
}

function toDateTimeLocal(epochMs: number): string {
  if (!epochMs) return "";
  const date = new Date(epochMs);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function SessionFormDialog({
  open,
  onOpenChange,
  course,
  confirmedStudentIds,
}: SessionFormDialogProps) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [conflictMessages, setConflictMessages] = useState<string[]>([]);
  const createSession = useCreateClassSession();

  async function handleSubmit() {
    setConflictMessages([]);
    if (!startAt || !endAt) {
      toast.error("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.");
      return;
    }
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (endMs <= startMs) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }

    try {
      await createSession.mutateAsync({
        courseId: course.id,
        courseName: course.name,
        teacherId: course.teacherId,
        roomId: course.roomId,
        studentIds: confirmedStudentIds,
        startAt: startMs,
        endAt: endMs,
      });
      toast.success("Đã thêm buổi học vào lịch.");
      setStartAt("");
      setEndAt("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ScheduleConflictError) {
        setConflictMessages(error.conflicts.map((c) => c.message));
      } else {
        toast.error("Không thể thêm buổi học. Vui lòng thử lại.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm buổi học</DialogTitle>
          <DialogDescription>
            Buổi học sẽ dùng giảng viên và phòng học của khoá "{course.name}". Hệ thống sẽ tự
            động kiểm tra xung đột lịch trước khi lưu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="session-start">Bắt đầu *</Label>
            <Input
              id="session-start"
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-end">Kết thúc *</Label>
            <Input
              id="session-end"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </div>
        </div>

        {conflictMessages.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Xung đột lịch</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {conflictMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createSession.isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={createSession.isPending}>
            {createSession.isPending ? "Đang kiểm tra..." : "Thêm buổi học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
