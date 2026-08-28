"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";

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
import { EntityStatusBadge } from "@/components/entity-form";
import { useStudentSessions } from "@/hooks/use-class-sessions";
import { useStudentEnrollmentsWithCourses } from "@/hooks/use-enrollments";
import { useStudent } from "@/hooks/use-students";
import { COURSE_STATUS_LABELS, type CourseStatus } from "@/types/course";
import { ENROLLMENT_STATUS_LABELS } from "@/types/enrollment";

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

function formatDateTime(epochMs: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(epochMs);
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();

  const { data: student, isLoading } = useStudent(studentId);
  const { data: enrollments } = useStudentEnrollmentsWithCourses(studentId);
  const { data: sessions } = useStudentSessions(studentId);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
        <p className="text-sm text-muted-foreground">Không tìm thấy học viên.</p>
        <Button variant="outline" onClick={() => router.push("/students")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const now = Date.now();
  const upcomingSessions = (sessions ?? []).filter((s) => !s.isFinished && s.startAt >= now);
  const pastSessions = (sessions ?? []).filter((s) => s.isFinished || s.startAt < now);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-1 px-2"
        onClick={() => router.push("/students")}
      >
        <ArrowLeft className="size-4" />
        Danh sách học viên
      </Button>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{getInitials(student.fullName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{student.fullName}</h1>
            <EntityStatusBadge status={student.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> {student.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> {student.phone}
            </span>
            <span>Sinh ngày {formatDate(student.dateOfBirth)}</span>
          </div>
          {student.suspendedReason && (
            <p className="text-sm text-amber-600">Lý do bảo lưu: {student.suspendedReason}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">
          Khoá học đang tham gia ({enrollments?.length ?? 0})
        </h2>

        {(enrollments?.length ?? 0) === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Học viên chưa đăng ký khoá học nào.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoá học</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Khai giảng</TableHead>
                  <TableHead>Trạng thái khoá</TableHead>
                  <TableHead>Trạng thái đăng ký</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments?.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                    <TableCell>{enrollment.teacherName}</TableCell>
                    <TableCell>{formatDate(enrollment.startDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {COURSE_STATUS_LABELS[enrollment.courseStatus as CourseStatus] ??
                          enrollment.courseStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Lịch học sắp tới ({upcomingSessions.length})</h2>

        {upcomingSessions.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Không có buổi học nào sắp tới.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {upcomingSessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/courses/${session.courseId}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">{session.courseName}</span>
                  <span className="text-muted-foreground">
                    {formatDateTime(session.startAt)} – {formatDateTime(session.endAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pastSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Đã học ({pastSessions.length} buổi)</h2>
          <p className="text-xs text-muted-foreground">
            Xem chi tiết trong trang từng khoá học.
          </p>
        </div>
      )}
    </div>
  );
}
