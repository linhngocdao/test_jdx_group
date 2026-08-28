import { Badge } from "@/components/ui/badge";
import type { EntityStatus } from "@/types/entity";

interface EntityStatusBadgeProps {
  status: EntityStatus;
}

export function EntityStatusBadge({ status }: EntityStatusBadgeProps) {
  if (status === "suspended") {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
        Tạm ngưng
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
      Đang hoạt động
    </Badge>
  );
}
