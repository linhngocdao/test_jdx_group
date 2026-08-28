"use client";

import { useState } from "react";
import type { CourseStatusCounts } from "@/lib/scheduling/dashboard-metrics";

interface CourseStatusBarChartProps {
  counts: CourseStatusCounts;
}

const ROWS: { key: keyof CourseStatusCounts; label: string; color: string }[] = [
  { key: "open", label: "Đang mở đăng ký", color: "var(--chart-1)" },
  { key: "ongoing", label: "Đang diễn ra", color: "var(--chart-3)" },
  { key: "draft", label: "Nháp", color: "var(--muted-foreground)" },
  { key: "finished", label: "Đã kết thúc", color: "var(--chart-4)" },
  { key: "cancelled", label: "Đã huỷ", color: "var(--chart-critical)" },
];

export function CourseStatusBarChart({ counts }: CourseStatusBarChartProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const total = ROWS.reduce((sum, row) => sum + counts[row.key], 0);
  const maxValue = Math.max(...ROWS.map((row) => counts[row.key]), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Khoá học theo trạng thái</h2>
        <span className="text-xs text-muted-foreground">{total} khoá học</span>
      </div>

      <div className="space-y-2.5">
        {ROWS.map((row) => {
          const value = counts[row.key];
          const widthPct = total === 0 ? 0 : Math.max((value / maxValue) * 100, value > 0 ? 4 : 0);
          return (
            <div
              key={row.key}
              className="group flex items-center gap-3"
              onMouseEnter={() => setHoverKey(row.key)}
              onMouseLeave={() => setHoverKey(null)}
            >
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{row.label}</span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-muted/40">
                <div
                  className="h-full rounded-sm transition-[width] duration-300 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: row.color,
                    opacity: hoverKey === null || hoverKey === row.key ? 1 : 0.45,
                  }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
