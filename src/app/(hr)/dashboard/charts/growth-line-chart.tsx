"use client";

import { useMemo, useState } from "react";
import { TableIcon, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "@/lib/scheduling/dashboard-metrics";

interface GrowthLineChartProps {
  data: MonthlyPoint[];
}

const WIDTH = 340;
const HEIGHT = 200;
const PADDING = { top: 12, right: 24, bottom: 24, left: 30 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

interface MiniLineChartProps {
  title: string;
  data: MonthlyPoint[];
  valueKey: "newStudents" | "newCourses";
  color: string;
}

/**
 * Panel riêng cho từng series thay vì 1 trục dùng chung — "Học viên mới"
 * (hàng trăm/tháng) và "Khoá học mới" (hàng chục/tháng) lệch nhau quá xa về
 * biên độ, ép chung 1 trục sẽ khiến series nhỏ hơn bẹp sát đáy (dual-axis
 * cũng sai vì tạo tương quan giả). Two charts, small multiples — theo đúng
 * khuyến nghị của dataviz skill.
 */
function MiniLineChart({ title, data, valueKey, color }: MiniLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = useMemo(
    () => niceMax(Math.max(...data.map((d) => d[valueKey]), 1)),
    [data, valueKey]
  );

  const xForIndex = (i: number) => PADDING.left + (i / (data.length - 1)) * PLOT_WIDTH;
  const yForValue = (v: number) => PADDING.top + PLOT_HEIGHT - (v / maxValue) * PLOT_HEIGHT;
  const yTicks = [0, maxValue / 2, maxValue];

  const forecastStartIndex = data.findIndex((d) => d.isForecast) - 1;

  function buildPath(fromIndex: number, toIndex: number): string {
    const points = data
      .slice(fromIndex, toIndex + 1)
      .map((d, i) => `${xForIndex(fromIndex + i)},${yForValue(d[valueKey])}`);
    return `M${points.join(" L")}`;
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const latest = data[data.length - 2]; // last real (non-forecast) point
  const forecast = data[data.length - 1];
  const trendUp = forecast[valueKey] >= latest[valueKey];

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <span className={cn("text-xs font-medium", trendUp ? "text-chart-good" : "text-chart-critical")}>
          {trendUp ? "↑" : "↓"} dự đoán {forecast[valueKey]}
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${title} theo tháng, kèm dự đoán tháng tiếp theo`}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={yForValue(tick)}
                y2={yForValue(tick)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 6}
                y={yForValue(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="var(--muted-foreground)"
              >
                {Math.round(tick)}
              </text>
            </g>
          ))}

          {data.map((d, i) => (
            <text
              key={d.monthStart}
              x={xForIndex(i)}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontSize={9}
              fill="var(--muted-foreground)"
            >
              {d.label.replace(/\/\d+$/, "")}
            </text>
          ))}

          <path
            d={buildPath(0, forecastStartIndex + 1)}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={buildPath(forecastStartIndex, data.length - 1)}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
            opacity={0.7}
          />
          {data.map((d, i) => (
            <circle
              key={d.monthStart}
              cx={xForIndex(i)}
              cy={yForValue(d[valueKey])}
              r={d.isForecast ? 3.5 : 4}
              fill={color}
              stroke="var(--card)"
              strokeWidth={2}
              opacity={d.isForecast ? 0.8 : 1}
            />
          ))}

          {data.map((d, i) => (
            <g key={d.monthStart}>
              {hoverIndex === i && (
                <line
                  x1={xForIndex(i)}
                  x2={xForIndex(i)}
                  y1={PADDING.top}
                  y2={PADDING.top + PLOT_HEIGHT}
                  stroke="var(--muted-foreground)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              )}
              <rect
                x={xForIndex(i) - PLOT_WIDTH / data.length / 2}
                y={PADDING.top}
                width={PLOT_WIDTH / data.length}
                height={PLOT_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                tabIndex={0}
                aria-label={`${d.label}: ${d[valueKey]}${d.isForecast ? " (dự đoán)" : ""}`}
              />
            </g>
          ))}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-1 z-10 rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
            style={{
              left: `${(xForIndex(hoverIndex!) / WIDTH) * 100}%`,
              transform: hoverIndex! > data.length / 2 ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            <span className="font-medium">{hovered.label}</span>
            {hovered.isForecast && <span className="text-muted-foreground"> · dự đoán</span>}
            <span className="ml-2 font-semibold tabular-nums">{hovered[valueKey]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GrowthLineChart({ data }: GrowthLineChartProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Tăng trưởng theo tháng</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={() => setShowTable((v) => !v)}
        >
          <TableIcon className="size-3.5" />
          {showTable ? "Xem biểu đồ" : "Xem bảng"}
        </Button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tháng</TableHead>
                <TableHead className="text-right">Học viên mới</TableHead>
                <TableHead className="text-right">Khoá học mới</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.monthStart}>
                  <TableCell>
                    {d.label}
                    {d.isForecast && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(dự đoán)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{d.newStudents}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.newCourses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <MiniLineChart
            title="Học viên mới"
            data={data}
            valueKey="newStudents"
            color="var(--chart-1)"
          />
          <MiniLineChart
            title="Khoá học mới"
            data={data}
            valueKey="newCourses"
            color="var(--chart-2)"
          />
        </div>
      )}
    </div>
  );
}
