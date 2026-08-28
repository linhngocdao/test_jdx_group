import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export function DataTableSkeleton({ columnCount, rowCount = 8 }: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-2 rounded-md border p-4">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
