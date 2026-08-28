"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateClassSession, useUpdateClassSession } from "@/hooks/use-class-sessions";
import type { EnrollmentWithNames } from "@/hooks/use-enrollments";
import { useActiveRooms } from "@/hooks/use-rooms";
import { useActiveTeachers } from "@/hooks/use-teachers";
import { ScheduleConflictError } from "@/lib/scheduling/conflict-detection";
import type { ClassSession } from "@/types/class-session";
import type { Course } from "@/types/course";

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  /** Học viên đã confirmed của khoá — nguồn để chọn ai tham gia buổi này. */
  confirmedStudents: EnrollmentWithNames[];
  /** Khi có giá trị: dialog ở chế độ sửa buổi học này thay vì tạo mới. */
  editingSession?: ClassSession | null;
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
  confirmedStudents,
  editingSession,
}: SessionFormDialogProps) {
  const isEditing = Boolean(editingSession);
  const [teacherId, setTeacherId] = useState(course.teacherId);
  const [roomId, setRoomId] = useState(course.roomId);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [conflictMessages, setConflictMessages] = useState<string[]>([]);

  const { data: allTeachers } = useActiveTeachers();
  const { data: allRooms } = useActiveRooms();
  const createSession = useCreateClassSession();
  const updateSession = useUpdateClassSession();
  const isPending = createSession.isPending || updateSession.isPending;

  // Chỉ cho chọn trong số giảng viên/phòng đã được gán cho khoá học này
  // (course.teacherIds/roomIds), không phải toàn bộ danh sách active của
  // trung tâm — tránh phân công nhầm người/phòng không liên quan.
  const allowedTeacherIds = course.teacherIds?.length ? course.teacherIds : [course.teacherId];
  const allowedRoomIds = course.roomIds?.length ? course.roomIds : [course.roomId];
  const teachers = allTeachers?.filter((t) => allowedTeacherIds.includes(t.id));
  const rooms = allRooms?.filter((r) => allowedRoomIds.includes(r.id));

  useEffect(() => {
    if (!open) return;
    setConflictMessages([]);
    if (editingSession) {
      setTeacherId(editingSession.teacherId);
      setRoomId(editingSession.roomId);
      setStartAt(toDateTimeLocal(editingSession.startAt));
      setEndAt(toDateTimeLocal(editingSession.endAt));
      setStudentIds(editingSession.studentIds);
    } else {
      setTeacherId(course.teacherId);
      setRoomId(course.roomId);
      setStartAt("");
      setEndAt("");
      // Mặc định tick hết học viên đã confirmed — phù hợp trường hợp phổ
      // biến (cả lớp học chung), admin bỏ tick cho buổi đặc biệt (ôn tập tự
      // chọn, chia nhóm...).
      setStudentIds(confirmedStudents.map((s) => s.studentId));
    }
  }, [open, editingSession, course.teacherId, course.roomId, confirmedStudents]);

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

    const input = {
      courseId: course.id,
      courseName: course.name,
      teacherId,
      roomId,
      studentIds,
      startAt: startMs,
      endAt: endMs,
    };

    try {
      if (isEditing && editingSession) {
        await updateSession.mutateAsync({ id: editingSession.id, input });
        toast.success("Đã cập nhật buổi học.");
      } else {
        await createSession.mutateAsync(input);
        toast.success("Đã thêm buổi học vào lịch.");
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ScheduleConflictError) {
        setConflictMessages(error.conflicts.map((c) => c.message));
      } else {
        toast.error("Không thể lưu buổi học. Vui lòng thử lại.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa buổi học" : "Thêm buổi học"}</DialogTitle>
          <DialogDescription>
            Mặc định dùng giảng viên/phòng học của khoá "{course.name}", có thể đổi riêng cho buổi
            này (dạy thay, đổi phòng...). Hệ thống sẽ tự động kiểm tra xung đột lịch trước khi lưu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Giảng viên *</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn giảng viên" />
              </SelectTrigger>
              <SelectContent>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                    {teacher.id === course.teacherId && " (phụ trách chính)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phòng học *</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn phòng học" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                    {room.id === course.roomId && " (mặc định)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Học viên tham gia buổi này ({studentIds.length}/{confirmedStudents.length})</Label>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => setStudentIds(confirmedStudents.map((s) => s.studentId))}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => setStudentIds([])}
              >
                Bỏ chọn hết
              </button>
            </div>
          </div>
          {confirmedStudents.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Khoá học chưa có học viên nào được xác nhận.
            </p>
          ) : (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {confirmedStudents.map((student) => {
                  const checked = studentIds.includes(student.studentId);
                  return (
                    <label
                      key={student.studentId}
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          setStudentIds((current) =>
                            next
                              ? [...current, student.studentId]
                              : current.filter((id) => id !== student.studentId)
                          );
                        }}
                      />
                      <span className="truncate">{student.studentName}</span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {conflictMessages.length > 0 && (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertTriangle className="size-4 text-red-600" />
            <AlertTitle className="text-red-900">Xung đột lịch</AlertTitle>
            <AlertDescription className="text-red-700">
              <ul className="list-disc space-y-1 pl-4">
                {conflictMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Đang kiểm tra..." : isEditing ? "Lưu thay đổi" : "Thêm buổi học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
