import { Inbox } from "lucide-react";

interface DataTableEmptyProps {
  title?: string;
  description?: string;
}

export function DataTableEmpty({
  title = "Không có dữ liệu",
  description = "Chưa có bản ghi nào phù hợp với bộ lọc hiện tại.",
}: DataTableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-16 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
