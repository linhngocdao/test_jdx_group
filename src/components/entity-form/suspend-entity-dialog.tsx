"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SuspendEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => Promise<unknown>;
}

/** Dialog nhập lý do tạm ngưng — dùng chung cho giảng viên/học viên/phòng học. */
export function SuspendEntityDialog({
  open,
  onOpenChange,
  entityName,
  reasonPlaceholder = "Vd: nghỉ dài hạn, đang sửa chữa, bảo lưu...",
  onConfirm,
}: SuspendEntityDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      toast.success(`Đã tạm ngưng "${entityName}".`);
      setReason("");
      onOpenChange(false);
    } catch {
      toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạm ngưng &quot;{entityName}&quot;</DialogTitle>
          <DialogDescription>
            Hồ sơ tạm ngưng sẽ không thể được gán cho hoạt động mới (khoá học, lịch dạy...).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="suspend-reason">Lý do</Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={reasonPlaceholder}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Xác nhận tạm ngưng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
