"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  DoorOpen,
  GraduationCap,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardMetrics } from "@/hooks/use-dashboard";

import { CourseStatusBarChart } from "./charts/course-status-bar-chart";
import { GrowthLineChart } from "./charts/growth-line-chart";
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
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const { statusCounts, atRiskCourses, teacherLoadRanking, growthSeries } = metrics;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Tổng quan vận hành</h1>
        <p className="text-sm text-muted-foreground">
          Cập nhật mỗi phút · trạng thái khoá học, tăng trưởng và cảnh báo vận hành.
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
          <GrowthLineChart data={growthSeries} />
        </div>
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <CourseStatusBarChart counts={statusCounts} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-chart-warning" />
            <h2 className="text-sm font-semibold">Khoá học có nguy cơ phải huỷ</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Sắp khai giảng (trong 14 ngày) nhưng chưa đủ học viên tối thiểu.
          </p>

          {atRiskCourses.length === 0 ? (
            <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
              Không có khoá học nào ở diện rủi ro.
            </p>
          ) : (
            <ul className="max-h-72 divide-y overflow-y-auto">
              {atRiskCourses.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/courses/${course.id}`}
                    className="group flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-foreground"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{course.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Khai giảng {formatDate(course.startDate)} · còn {course.daysUntilStart} ngày
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="border-chart-warning/40 text-chart-warning">
                        {course.confirmedCount}/{course.minStudents}
                      </Badge>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-chart-2" />
            <h2 className="text-sm font-semibold">Giảng viên đang quá tải</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">Từ 10 buổi dạy sắp tới trở lên.</p>

          {teacherLoadRanking.length === 0 ? (
            <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
              Không có giảng viên nào đang quá tải.
            </p>
          ) : (
            <ul className="max-h-72 divide-y overflow-y-auto">
              {teacherLoadRanking.map((teacher) => {
                const maxSessions = teacherLoadRanking[0]?.upcomingSessionCount || 1;
                const widthPct = Math.max((teacher.upcomingSessionCount / maxSessions) * 100, 8);
                return (
                  <li key={teacher.id}>
                    <Link
                      href="/teachers"
                      className="group flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-foreground"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-medium">{teacher.fullName}</span>
                        <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted/60">
                          <div
                            className="h-full rounded-full bg-chart-2 transition-[width] duration-300 ease-out"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                        {teacher.upcomingSessionCount} buổi
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
