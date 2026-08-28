"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeleteGuardError } from "@/hooks/use-crud-query";

interface DeleteEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  onConfirm: () => Promise<unknown>;
}

/**
 * Dialog xác nhận xoá dùng chung cho mọi module. Nếu mutation ném
 * `DeleteGuardError` (vì hồ sơ đang gán hoạt động chưa kết thúc), dialog hiện
 * rõ lý do thay vì đóng lại như xoá thành công.
 */
export function DeleteEntityDialog({
  open,
  onOpenChange,
  entityName,
  onConfirm,
}: DeleteEntityDialogProps) {
  const [blockers, setBlockers] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    setBlockers([]);
    try {
      await onConfirm();
      toast.success(`Đã xoá "${entityName}".`);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof DeleteGuardError) {
        setBlockers(error.blockers);
      } else {
        toast.error("Không thể xoá hồ sơ. Vui lòng thử lại.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setBlockers([]);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá &quot;{entityName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Hành động này không thể hoàn tác.</p>
              {blockers.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {blockers.map((blocker) => (
                    <p key={blocker}>{blocker}</p>
                  ))}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? "Đang xoá..." : "Xoá"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
