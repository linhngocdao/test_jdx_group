"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCourseSessions, useCourseTeachers, useRemoveClassSession } from "@/hooks/use-class-sessions";
import { cn } from "@/lib/utils";
import type { ClassSession } from "@/types/class-session";

const CATEGORICAL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 48;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // tuần bắt đầu từ Thứ 2
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(weekStart)} – ${fmt(weekEnd)}/${weekEnd.getFullYear()}`;
}

interface SessionWeekCalendarProps {
  courseId: string;
  onEditSession: (session: ClassSession) => void;
}

/**
 * Lịch tuần trực quan cho khoá học — mỗi buổi học đặt đúng ô ngày/giờ, màu
 * theo giáo viên phụ trách (để "phân bổ theo từng giảng viên" nhìn ra ngay
 * ai dạy buổi nào trong tuần), thay vì chỉ liệt kê phẳng như bảng.
 */
export function SessionWeekCalendar({ courseId, onEditSession }: SessionWeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const { data: sessions } = useCourseSessions(courseId);
  const { data: teachers } = useCourseTeachers(courseId);
  const removeSession = useRemoveClassSession();

  const teacherColorById = useMemo(() => {
    const map = new Map<string, string>();
    teachers?.forEach((teacher, index) => {
      map.set(teacher.id, CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]);
    });
    return map;
  }, [teachers]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const weekSessions = useMemo(
    () =>
      (sessions ?? []).filter(
        (s) => s.startAt >= weekStart.getTime() && s.startAt < weekEnd.getTime()
      ),
    [sessions, weekStart, weekEnd]
  );

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  function sessionStyle(session: ClassSession) {
    const start = new Date(session.startAt);
    const dayIndex = (start.getDay() + 6) % 7; // Thứ 2 = 0
    const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const durationMinutes = (session.endAt - session.startAt) / 60000;
    return {
      dayIndex,
      top: (startMinutes / 60) * HOUR_HEIGHT,
      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 22),
    };
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setWeekStart((d) => new Date(d.getTime() - 7 * 86_400_000))}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">{formatWeekRange(weekStart)}</span>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setWeekStart((d) => new Date(d.getTime() + 7 * 86_400_000))}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWeekStart(startOfWeek(new Date()))}>
          Tuần này
        </Button>
      </div>

      {/* Legend theo giáo viên — màu là kênh nhận diện chính, kèm tên để không chỉ dựa vào màu */}
      {teachers && teachers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: teacherColorById.get(teacher.id) }}
              />
              {teacher.fullName}
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <div className="grid min-w-[640px] grid-cols-[44px_repeat(7,1fr)]">
          <div className="border-b" />
          {DAY_LABELS.map((label, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return (
              <div key={label} className="border-b border-l px-2 py-1.5 text-center text-xs">
                <span className="font-medium">{label}</span>{" "}
                <span className="text-muted-foreground">{date.getDate()}/{date.getMonth() + 1}</span>
              </div>
            );
          })}

          <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-1 -translate-y-2 text-[10px] text-muted-foreground"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                {hour}h
              </div>
            ))}
          </div>

          {Array.from({ length: 7 }, (_, dayIndex) => (
            <div
              key={dayIndex}
              className="relative border-l"
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full border-t border-dashed"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                />
              ))}

              {weekSessions
                .filter((s) => sessionStyle(s).dayIndex === dayIndex)
                .map((session) => {
                  const style = sessionStyle(session);
                  const color = teacherColorById.get(session.teacherId) ?? CATEGORICAL_COLORS[0];
                  return (
                    <Tooltip key={session.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onEditSession(session)}
                          className={cn(
                            "group absolute inset-x-0.5 overflow-hidden rounded-sm px-1.5 py-1 text-left text-[11px] leading-tight text-white transition-opacity hover:opacity-90",
                            session.isFinished && "opacity-50"
                          )}
                          style={{ top: style.top, height: style.height, backgroundColor: color }}
                        >
                          <span className="font-medium">
                            {new Date(session.startAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-56">
                        <div className="space-y-1 text-xs">
                          <p className="font-medium">
                            {new Date(session.startAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {new Date(session.endAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p>{session.studentIds.length} học viên</p>
                          <div className="flex gap-1.5 pt-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 px-2 text-[11px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditSession(session);
                              }}
                            >
                              <Pencil className="size-3" /> Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 px-2 text-[11px] text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSession.mutate(session.id, {
                                  onSuccess: () => toast.success("Đã xoá buổi học."),
                                  onError: () => toast.error("Không thể xoá buổi học."),
                                });
                              }}
                            >
                              <Trash2 className="size-3" /> Xoá
                            </Button>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
