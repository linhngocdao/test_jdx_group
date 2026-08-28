import { Badge } from "@/components/ui/badge";
import { COURSE_STATUS_LABELS } from "@/types/course";
import type { CourseStatus } from "@/types/course";

const STATUS_STYLES: Record<CourseStatus, string> = {
  draft: "border-slate-300 bg-slate-50 text-slate-700",
  open: "border-blue-300 bg-blue-50 text-blue-700",
  ongoing: "border-emerald-300 bg-emerald-50 text-emerald-700",
  finished: "border-gray-300 bg-gray-50 text-gray-500",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {COURSE_STATUS_LABELS[status]}
    </Badge>
  );
}
