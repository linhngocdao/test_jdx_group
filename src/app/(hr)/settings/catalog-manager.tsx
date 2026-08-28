"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteEntityDialog } from "@/components/entity-form";
import type { BaseEntity } from "@/types/entity";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

interface CatalogEntity extends BaseEntity {
  name: string;
}

interface CatalogManagerProps<T extends CatalogEntity, TInput extends { name: string; status: "active" | "suspended" }> {
  title: string;
  description: string;
  addLabel: string;
  listQuery: UseQueryResult<{ rows: T[]; total: number }>;
  createMutation: UseMutationResult<T, Error, TInput>;
  updateMutation: UseMutationResult<T, Error, { id: string; input: TInput }>;
  removeMutation: UseMutationResult<void, Error, string>;
}

/**
 * CRUD dùng chung cho các danh mục nhỏ (chuyên môn, loại thiết bị...) — thay
 * vì fix cứng trong code, admin tự thêm/sửa/xoá được ngay tại đây. Item đang
 * bị dùng ở nơi khác (giảng viên/phòng) không xoá được, hệ thống báo rõ lý do
 * thay vì cho xoá và để lại tham chiếu treo.
 */
export function CatalogManager<
  T extends CatalogEntity,
  TInput extends { name: string; status: "active" | "suspended" },
>({
  title,
  description,
  addLabel,
  listQuery,
  createMutation,
  updateMutation,
  removeMutation,
}: CatalogManagerProps<T, TInput>) {
  const [dialog, setDialog] = useState<
    { type: "closed" } | { type: "create" } | { type: "edit"; item: T } | { type: "delete"; item: T }
  >({ type: "closed" });
  const [nameInput, setNameInput] = useState("");

  const items = listQuery.data?.rows ?? [];

  function openCreate() {
    setNameInput("");
    setDialog({ type: "create" });
  }

  function openEdit(item: T) {
    setNameInput(item.name);
    setDialog({ type: "edit", item });
  }

  async function handleSubmit() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập tên.");
      return;
    }
    try {
      if (dialog.type === "create") {
        await createMutation.mutateAsync({ name: trimmed, status: "active" } as TInput);
        toast.success(`Đã thêm "${trimmed}".`);
      } else if (dialog.type === "edit") {
        await updateMutation.mutateAsync({
          id: dialog.item.id,
          input: { ...dialog.item, name: trimmed } as unknown as TInput,
        });
        toast.success(`Đã cập nhật "${trimmed}".`);
      }
      setDialog({ type: "closed" });
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>

      {listQuery.isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!listQuery.isLoading && items.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Chưa có mục nào.
        </p>
      )}

      {items.length > 0 && (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                {item.status === "suspended" && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                    Tạm ẩn
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(item)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setDialog({ type: "delete", item })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialog.type === "create" || dialog.type === "edit"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.type === "edit" ? "Đổi tên" : addLabel}</DialogTitle>
            <DialogDescription>Tên hiển thị trong các form liên quan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="catalog-name">Tên *</Label>
            <Input
              id="catalog-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setDialog({ type: "closed" })}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteEntityDialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => !open && setDialog({ type: "closed" })}
        entityName={dialog.type === "delete" ? dialog.item.name : ""}
        onConfirm={async () => {
          if (dialog.type !== "delete") return;
          await removeMutation.mutateAsync(dialog.item.id);
        }}
      />
    </div>
  );
}
