import type { RefObject } from "react";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";

export interface UseVirtualizedRowsOptions {
  count: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  rowHeight?: number;
  overscan?: number;
  /** Chỉ virtualize khi số dòng vượt ngưỡng này — bảng nhỏ thì render thẳng cho đơn giản. */
  threshold?: number;
}

export interface UseVirtualizedRowsReturn {
  isVirtualized: boolean;
  virtualItems: VirtualItem[];
  totalSize: number;
}

const DEFAULT_ROW_HEIGHT = 48;
const DEFAULT_THRESHOLD = 30;

/**
 * Bọc TanStack Virtual để mọi bảng dữ liệu lớn (hồ sơ giảng viên/học viên/phòng học
 * lên tới hàng trăm nghìn bản ghi) chỉ render các dòng trong viewport thay vì
 * toàn bộ DOM rows, tránh đơ trình duyệt.
 */
export function useVirtualizedRows({
  count,
  scrollContainerRef,
  rowHeight = DEFAULT_ROW_HEIGHT,
  overscan = 8,
  threshold = DEFAULT_THRESHOLD,
}: UseVirtualizedRowsOptions): UseVirtualizedRowsReturn {
  const isVirtualized = count > threshold;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan,
    enabled: isVirtualized,
  });

  if (!isVirtualized) {
    return { isVirtualized, virtualItems: [], totalSize: 0 };
  }

  return {
    isVirtualized,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  };
}
