"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentCombobox } from "@/components/entity-form";
import { EnrollmentEligibilityError, useCreateEnrollment } from "@/hooks/use-enrollments";
import type { Course } from "@/types/course";

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  alreadyEnrolledStudentIds: string[];
}

export function EnrollStudentDialog({
  open,
  onOpenChange,
  course,
  alreadyEnrolledStudentIds,
}: EnrollStudentDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const createEnrollment = useCreateEnrollment();

  async function handleSubmit() {
    setReasons([]);
    if (!studentId) {
      toast.error("Vui lòng chọn học viên.");
      return;
    }
    try {
      await createEnrollment.mutateAsync({ studentId, courseId: course.id });
      toast.success("Đã đăng ký học viên vào khoá học.");
      setStudentId("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof EnrollmentEligibilityError) {
        setReasons(error.reasons);
      } else {
        toast.error("Không thể đăng ký. Vui lòng thử lại.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng ký học viên</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ kiểm tra khoá đang mở đăng ký, học viên đủ điều kiện, còn chỗ theo sức
            chứa phòng và không trùng lịch trước khi xác nhận.
          </DialogDescription>
        </DialogHeader>

        <StudentCombobox
          value={studentId}
          onChange={setStudentId}
          excludeStudentIds={alreadyEnrolledStudentIds}
          placeholder="Chọn học viên"
        />

        {reasons.length > 0 && (
          <Alert className="border-red-200 bg-red-50 text-red-900">
            <AlertTriangle className="size-4 text-red-600" />
            <AlertTitle className="text-red-900">Không thể đăng ký</AlertTitle>
            <AlertDescription className="text-red-700">
              <ul className="list-disc space-y-1 pl-4">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createEnrollment.isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={createEnrollment.isPending}>
            {createEnrollment.isPending ? "Đang kiểm tra..." : "Đăng ký"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
