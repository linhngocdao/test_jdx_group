"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourseTeachers } from "@/hooks/use-class-sessions";
import {
  useCourse,
  useCourseEnrollmentCount,
  useTransitionCourseStatus,
} from "@/hooks/use-courses";
import { useCourseEnrollments } from "@/hooks/use-enrollments";
import { useExportCourseStudents } from "@/hooks/use-export";
import { useRoom } from "@/hooks/use-rooms";
import { useTeacher } from "@/hooks/use-teachers";
import { COURSE_TRANSITIONS, COURSE_STATUS_LABELS } from "@/types/course";
import type { CourseStatus } from "@/types/course";
import type { ClassSession } from "@/types/class-session";

import { CourseStatusBadge } from "../course-status-badge";
import { EnrollmentList } from "./enrollment-list";
import { EnrollStudentDialog } from "./enroll-student-dialog";
import { SessionFormDialog } from "./session-form-dialog";
import { SessionList } from "./session-list";
import { SessionWeekCalendar } from "./session-week-calendar";

function formatDate(epochMs: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();

  const { data: course, isLoading } = useCourse(courseId);
  const { data: primaryTeacher } = useTeacher(course?.teacherId);
  const { data: room } = useRoom(course?.roomId);
  const { data: confirmedCount } = useCourseEnrollmentCount(courseId);
  const { data: enrollments } = useCourseEnrollments(courseId);
  const { data: teachingTeachers } = useCourseTeachers(courseId);
  const transition = useTransitionCourseStatus();
  const exportStudents = useExportCourseStudents();

  const [sessionDialogState, setSessionDialogState] = useState<
    { type: "closed" } | { type: "create" } | { type: "edit"; session: ClassSession }
  >({ type: "closed" });
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
        <p className="text-sm text-muted-foreground">Không tìm thấy khoá học.</p>
        <Button variant="outline" onClick={() => router.push("/courses")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const nextStatuses = COURSE_TRANSITIONS[course.courseStatus];
  const activeEnrolledStudentIds = (enrollments ?? [])
    .filter((e) => e.enrollmentStatus === "pending" || e.enrollmentStatus === "confirmed")
    .map((e) => e.studentId);
  const confirmedStudents = (enrollments ?? []).filter((e) => e.enrollmentStatus === "confirmed");

  function handleTransition(to: CourseStatus) {
    if (to === "cancelled") {
      setPendingCancel(true);
      return;
    }
    transition.mutate(
      { id: course!.id, to },
      {
        onSuccess: () => toast.success(`Đã chuyển khoá học sang "${COURSE_STATUS_LABELS[to]}".`),
        onError: (error) => toast.error(error.message || "Không thể chuyển trạng thái."),
      }
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1 px-2"
          onClick={() => router.push("/courses")}
        >
          <ArrowLeft className="size-4" />
          Danh sách khoá học
        </Button>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{course.name}</h1>
              <CourseStatusBadge status={course.courseStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span>Giảng viên phụ trách:</span>
              {primaryTeacher ? (
                <Link href={`/teachers/${primaryTeacher.id}`} className="font-medium text-foreground hover:underline">
                  {primaryTeacher.fullName}
                </Link>
              ) : (
                "—"
              )}
              {teachingTeachers && teachingTeachers.length > 1 && (
                <span className="flex items-center gap-1">
                  · đang dạy thực tế:
                  {teachingTeachers.map((t) => (
                    <Link key={t.id} href={`/teachers/${t.id}`}>
                      <Badge variant="secondary" className="text-xs hover:bg-secondary/70">
                        {t.fullName} ({t.sessionCount})
                      </Badge>
                    </Link>
                  ))}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Phòng: {room?.name ?? "—"} · Khai giảng: {formatDate(course.startDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              Học viên đã xác nhận: {confirmedCount ?? 0}/{course.maxStudents} (tối thiểu cần{" "}
              {course.minStudents})
            </p>
            {course.cancelReason && (
              <p className="text-sm text-red-600">Lý do huỷ: {course.cancelReason}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportStudents.mutate(course.id, {
                  onSuccess: () => toast.success("Đã xuất danh sách học viên."),
                  onError: () => toast.error("Không thể xuất file."),
                });
              }}
              disabled={exportStudents.isPending}
            >
              <Download className="size-4" />
              Xuất danh sách học viên
            </Button>
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === "cancelled" ? "outline" : "default"}
                className={status === "cancelled" ? "text-destructive" : undefined}
                onClick={() => handleTransition(status)}
                disabled={transition.isPending}
              >
                Chuyển sang "{COURSE_STATUS_LABELS[status]}"
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Tabs defaultValue="calendar">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Lịch dạy</h2>
              <TabsList className="h-8">
                <TabsTrigger value="calendar" className="text-xs">Lịch tuần</TabsTrigger>
                <TabsTrigger value="table" className="text-xs">Bảng</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="calendar" className="mt-3">
              <SessionWeekCalendar
                courseId={courseId}
                onEditSession={(session) => setSessionDialogState({ type: "edit", session })}
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setSessionDialogState({ type: "create" })}
              >
                Thêm buổi học
              </Button>
            </TabsContent>
            <TabsContent value="table" className="mt-3">
              <SessionList
                courseId={courseId}
                onAddSession={() => setSessionDialogState({ type: "create" })}
                onEditSession={(session) => setSessionDialogState({ type: "edit", session })}
              />
            </TabsContent>
          </Tabs>
        </div>
        <EnrollmentList courseId={courseId} onEnroll={() => setEnrollDialogOpen(true)} />
      </div>

      <SessionFormDialog
        open={sessionDialogState.type !== "closed"}
        onOpenChange={(open) => !open && setSessionDialogState({ type: "closed" })}
        course={course}
        confirmedStudents={confirmedStudents}
        editingSession={sessionDialogState.type === "edit" ? sessionDialogState.session : null}
      />

      <EnrollStudentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        course={course}
        alreadyEnrolledStudentIds={activeEnrolledStudentIds}
      />

      <AlertDialog open={pendingCancel} onOpenChange={setPendingCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Huỷ khoá học "{course.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ đăng ký đang chờ/đã xác nhận sẽ tự động bị huỷ theo. Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                transition.mutate(
                  { id: course.id, to: "cancelled", cancelReason: "Huỷ thủ công bởi admin" },
                  {
                    onSuccess: () => toast.success("Đã huỷ khoá học."),
                    onError: (error) => toast.error(error.message || "Không thể huỷ khoá học."),
                  }
                );
                setPendingCancel(false);
              }}
            >
              Xác nhận huỷ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
