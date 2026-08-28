"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateStudent, useStudent, useUpdateStudent } from "@/hooks/use-students";
import { studentSchema } from "@/lib/validation/student-schema";
import type { StudentInput } from "@/types/student";

function toDateInputValue(epochMs: number): string {
  if (!epochMs) return "";
  return new Date(epochMs).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): number {
  return value ? new Date(value).getTime() : 0;
}

const DEFAULT_VALUES: StudentInput = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: 0,
  address: "",
  status: "active",
  suspendedReason: "",
};

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  studentId: string | null;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  mode,
  studentId,
}: StudentFormDialogProps) {
  const { data: existingStudent } = useStudent(mode === "edit" ? studentId ?? undefined : undefined);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const form = useForm<StudentInput>({
    resolver: yupResolver(studentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && existingStudent) {
      form.reset({
        fullName: existingStudent.fullName,
        email: existingStudent.email,
        phone: existingStudent.phone,
        dateOfBirth: existingStudent.dateOfBirth,
        address: existingStudent.address ?? "",
        status: existingStudent.status,
        suspendedReason: existingStudent.suspendedReason ?? "",
      });
    } else if (mode === "create") {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, mode, existingStudent, form]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: StudentInput) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
        toast.success(`Đã thêm học viên "${values.fullName}".`);
      } else if (studentId) {
        await updateMutation.mutateAsync({ id: studentId, input: values });
        toast.success(`Đã cập nhật học viên "${values.fullName}".`);
      }
      onOpenChange(false);
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm học viên" : "Chỉnh sửa học viên"}</DialogTitle>
          <DialogDescription>
            Nhập thông tin hồ sơ học viên. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ tên *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại *</FormLabel>
                    <FormControl>
                      <Input placeholder="09xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={toDateInputValue(field.value)}
                        onChange={(event) => field.onChange(fromDateInputValue(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Input placeholder="Địa chỉ liên hệ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : mode === "create" ? "Thêm học viên" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
