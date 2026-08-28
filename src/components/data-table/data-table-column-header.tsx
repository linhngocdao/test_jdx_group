import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<T> {
  column: Column<T, unknown>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<T>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<T>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "asc" && <ArrowUp className="ml-2 size-3.5" />}
      {sorted === "desc" && <ArrowDown className="ml-2 size-3.5" />}
      {!sorted && <ChevronsUpDown className="ml-2 size-3.5 text-muted-foreground" />}
    </Button>
  );
}
