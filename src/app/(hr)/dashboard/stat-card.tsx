import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
}

const TONE_VALUE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-chart-warning",
};

const TONE_ICON_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-muted-foreground",
  warning: "text-chart-warning",
};

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-3xl font-semibold tracking-tight", TONE_VALUE_STYLES[tone])}>
          {value}
        </span>
      </div>
      <Icon className={cn("size-5", TONE_ICON_STYLES[tone])} />
    </div>
  );
}
