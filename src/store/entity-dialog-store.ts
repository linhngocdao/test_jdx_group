import { create } from "zustand";

export type EntityDialogMode = "create" | "edit" | null;

interface EntityDialogState {
  mode: EntityDialogMode;
  entityId: string | null;
  openCreate: () => void;
  openEdit: (id: string) => void;
  close: () => void;
}

/**
 * Factory tạo store Zustand cho dialog form CRUD của 1 module (giảng viên,
 * học viên, phòng học...). Mỗi module gọi `createEntityDialogStore()` một lần
 * ở module-scope để có store riêng — tránh 1 store dùng chung bị đụng state
 * khi nhiều bảng cùng hiển thị trên một trang.
 *
 * Dùng Zustand thay vì useState cục bộ vì nút "sửa" có thể được kích hoạt từ
 * nhiều nơi (bảng desktop, card mobile, trang chi tiết) mà không cần khoan
 * props xuyên nhiều tầng component.
 */
export function createEntityDialogStore() {
  return create<EntityDialogState>((set) => ({
    mode: null,
    entityId: null,
    openCreate: () => set({ mode: "create", entityId: null }),
    openEdit: (id) => set({ mode: "edit", entityId: id }),
    close: () => set({ mode: null, entityId: null }),
  }));
}

export type EntityDialogStore = ReturnType<typeof createEntityDialogStore>;
