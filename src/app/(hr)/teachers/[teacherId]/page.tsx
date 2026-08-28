"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityStatusBadge, SessionDetailDialog } from "@/components/entity-form";
import { useTeacherSessions } from "@/hooks/use-class-sessions";
import { useExportTeacherSchedule } from "@/hooks/use-export";
import { useTeacher } from "@/hooks/use-teachers";
import type { ClassSession } from "@/types/class-session";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(epochMs);
}

const SPECIALTY_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  data: "Data",
  design: "Design",
  other: "Khác",
};

export default function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = use(params);
  const router = useRouter();

  const { data: teacher, isLoading } = useTeacher(teacherId);
  const { data: sessions } = useTeacherSessions(teacherId);
  const exportSchedule = useExportTeacherSchedule();
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const now = Date.now();
  const upcomingSessions = useMemo(
    () => (sessions ?? []).filter((s) => !s.isFinished && s.startAt >= now),
    [sessions, now]
  );
  const pastSessions = useMemo(
    () => (sessions ?? []).filter((s) => s.isFinished || s.startAt < now),
    [sessions, now]
  );

  const coursesByCount = useMemo(() => {
    const map = new Map<string, { courseId: string; courseName: string; count: number }>();
    for (const session of sessions ?? []) {
      const existing = map.get(session.courseId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(session.courseId, {
          courseId: session.courseId,
          courseName: session.courseName,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
        <p className="text-sm text-muted-foreground">Không tìm thấy giảng viên.</p>
        <Button variant="outline" onClick={() => router.push("/teachers")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isOverloaded = upcomingSessions.length > 10;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-1 px-2"
        onClick={() => router.push("/teachers")}
      >
        <ArrowLeft className="size-4" />
        Danh sách giảng viên
      </Button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{getInitials(teacher.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{teacher.fullName}</h1>
              <EntityStatusBadge status={teacher.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" /> {teacher.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" /> {teacher.phone}
              </span>
              <Badge variant="secondary">{SPECIALTY_LABELS[teacher.specialty]}</Badge>
            </div>
            {teacher.suspendedReason && (
              <p className="text-sm text-amber-600">Lý do tạm ngưng: {teacher.suspendedReason}</p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            exportSchedule.mutate(teacherId, {
              onSuccess: () => toast.success("Đã xuất lịch dạy."),
              onError: () => toast.error("Không thể xuất file."),
            });
          }}
          disabled={exportSchedule.isPending}
        >
          <Download className="size-4" />
          Xuất lịch dạy
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Buổi sắp tới</p>
          <p className={`text-2xl font-semibold ${isOverloaded ? "text-amber-600" : ""}`}>
            {upcomingSessions.length}
            {isOverloaded && " ⚠"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Đã dạy</p>
          <p className="text-2xl font-semibold">{pastSessions.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Số khoá học</p>
          <p className="text-2xl font-semibold">{coursesByCount.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Buổi/tuần (đăng ký)</p>
          <p className="text-2xl font-semibold">{teacher.weeklySessionLoad}</p>
        </div>
      </div>

      {isOverloaded && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Giảng viên đang có từ 10 buổi dạy sắp tới trở lên — cân nhắc phân công lại.
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Khoá học đang phụ trách ({coursesByCount.length})</h2>
        {coursesByCount.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Chưa được phân công buổi dạy nào.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {coursesByCount.map((c) => (
              <li key={c.courseId}>
                <Link href={`/courses/${c.courseId}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/70">
                    {c.courseName} ({c.count} buổi)
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Ca dạy sắp tới ({upcomingSessions.length})</h2>

        {upcomingSessions.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Không có buổi dạy nào sắp tới.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoá học</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Số học viên</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingSessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSession(session)}
                  >
                    <TableCell className="font-medium">{session.courseName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(session.startAt)} – {formatDateTime(session.endAt)}
                    </TableCell>
                    <TableCell>{session.studentIds.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <SessionDetailDialog
        open={selectedSession !== null}
        onOpenChange={(open) => !open && setSelectedSession(null)}
        session={selectedSession}
        teacherName={teacher.fullName}
      />
    </div>
  );
}
