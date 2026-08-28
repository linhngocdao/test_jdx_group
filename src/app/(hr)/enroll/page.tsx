"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentCombobox } from "@/components/entity-form";
import { useOpenCourses } from "@/hooks/use-courses";
import { EnrollmentEligibilityError, useCreateEnrollment, useStudentEnrollments } from "@/hooks/use-enrollments";
import { ENROLLMENT_STATUS_LABELS } from "@/types/enrollment";

const PAGE_SIZE = 9;

function formatDate(epochMs: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

export default function EnrollPage() {
  const [studentId, setStudentId] = useState<string>("");
  const [errorsByCourse, setErrorsByCourse] = useState<Record<string, string[]>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: openCourses, isLoading: coursesLoading } = useOpenCourses();
  const visibleCourses = openCourses?.slice(0, visibleCount);
  const hasMore = (openCourses?.length ?? 0) > visibleCount;
  const { data: myEnrollments } = useStudentEnrollments(studentId || undefined);
  const createEnrollment = useCreateEnrollment();

  const myEnrolledCourseIds = useMemo(
    () =>
      new Set(
        (myEnrollments ?? [])
          .filter((e) => e.enrollmentStatus !== "cancelled")
          .map((e) => e.courseId)
      ),
    [myEnrollments]
  );

  async function handleEnroll(courseId: string) {
    if (!studentId) {
      toast.error("Vui lòng chọn hồ sơ học viên của bạn trước.");
      return;
    }
    setErrorsByCourse((prev) => ({ ...prev, [courseId]: [] }));
    try {
      await createEnrollment.mutateAsync({ studentId, courseId });
      toast.success("Đăng ký thành công! Vui lòng chờ admin xác nhận.");
    } catch (error) {
      if (error instanceof EnrollmentEligibilityError) {
        setErrorsByCourse((prev) => ({ ...prev, [courseId]: error.reasons }));
      } else {
        toast.error("Không thể đăng ký. Vui lòng thử lại.");
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Đăng ký khoá học</h1>
        <p className="text-sm text-muted-foreground">
          Chọn hồ sơ học viên của bạn rồi đăng ký vào các khoá học đang mở nhận đăng ký.
        </p>
      </div>

      <div className="max-w-sm space-y-2">
        <p className="text-sm font-medium">Bạn là học viên nào?</p>
        <StudentCombobox
          value={studentId}
          onChange={setStudentId}
          placeholder="Chọn hồ sơ học viên của bạn"
        />
      </div>

      {coursesLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!coursesLoading && (openCourses?.length ?? 0) === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Hiện chưa có khoá học nào đang mở đăng ký.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCourses?.map((course) => {
          const alreadyEnrolled = myEnrolledCourseIds.has(course.id);
          const isFull = course.confirmedCount >= course.maxStudents;
          const errors = errorsByCourse[course.id] ?? [];

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{course.name}</CardTitle>
                  {isFull && <Badge variant="outline">Đã đầy</Badge>}
                </div>
                <CardDescription>
                  Giảng viên: {course.teacherName} · Phòng: {course.roomName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>Khai giảng: {formatDate(course.startDate)}</p>
                <p>
                  Đã đăng ký: {course.confirmedCount}/{course.maxStudents} (tối thiểu cần{" "}
                  {course.minStudents})
                </p>
                {errors.length > 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>Không thể đăng ký</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc space-y-1 pl-4">
                        {errors.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                {alreadyEnrolled ? (
                  <Button className="w-full" variant="outline" disabled>
                    <CheckCircle2 className="size-4" />
                    Đã đăng ký
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!studentId || isFull || createEnrollment.isPending}
                    onClick={() => handleEnroll(course.id)}
                  >
                    {createEnrollment.isPending ? "Đang xử lý..." : "Đăng ký khoá học này"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Đang hiện {visibleCourses?.length}/{openCourses?.length} khoá học
          </p>
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Xem thêm khoá học
          </Button>
        </div>
      )}

      {studentId && (myEnrollments?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Đăng ký của bạn</p>
          <div className="flex flex-wrap gap-2">
            {myEnrollments?.map((enrollment) => (
              <Badge key={enrollment.id} variant="outline">
                {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
