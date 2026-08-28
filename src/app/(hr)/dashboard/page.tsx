"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  CircleCheckBig,
  DoorOpen,
  GraduationCap,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardMetrics } from "@/hooks/use-dashboard";

import { StatCard } from "./stat-card";

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("vi-VN");
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const { statusCounts, atRiskCourses, teacherLoadRanking } = metrics;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Tổng quan vận hành</h1>
        <p className="text-sm text-muted-foreground">
          Trạng thái khoá học, cảnh báo nguy cơ huỷ và tải giảng dạy — cập nhật mỗi phút.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Giảng viên hoạt động" value={metrics.totalActiveTeachers} icon={GraduationCap} />
        <StatCard label="Học viên hoạt động" value={metrics.totalActiveStudents} icon={Users} />
        <StatCard label="Phòng học hoạt động" value={metrics.totalActiveRooms} icon={DoorOpen} />
        <StatCard
          label="Khoá có nguy cơ huỷ"
          value={atRiskCourses.length}
          icon={AlertTriangle}
          tone={atRiskCourses.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Nháp" value={statusCounts.draft} icon={BookOpenCheck} />
        <StatCard label="Đang mở đăng ký" value={statusCounts.open} icon={CalendarClock} />
        <StatCard label="Đang diễn ra" value={statusCounts.ongoing} icon={CircleCheckBig} />
        <StatCard label="Đã kết thúc" value={statusCounts.finished} icon={CircleCheckBig} />
        <StatCard label="Đã huỷ" value={statusCounts.cancelled} icon={XCircle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Khoá học có nguy cơ phải huỷ</CardTitle>
            <CardDescription>
              Sắp đến ngày khai giảng (trong 14 ngày) nhưng chưa đủ số học viên tối thiểu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRiskCourses.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có khoá học nào ở diện rủi ro.</p>
            )}
            {atRiskCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Khai giảng {formatDate(course.startDate)} · còn {course.daysUntilStart} ngày
                  </span>
                </div>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                  {course.confirmedCount}/{course.minStudents} tối thiểu
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giảng viên đang quá tải</CardTitle>
            <CardDescription>Từ 10 buổi dạy sắp tới trở lên.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teacherLoadRanking.length === 0 && (
              <p className="text-sm text-muted-foreground">Không có giảng viên nào đang quá tải.</p>
            )}
            {teacherLoadRanking.map((teacher) => (
              <Link
                key={teacher.id}
                href="/teachers"
                className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium">{teacher.fullName}</span>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                  {teacher.upcomingSessionCount} buổi sắp tới
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
