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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActiveSpecialties } from "@/hooks/use-specialties";
import { useCreateTeacher, useTeacher, useUpdateTeacher } from "@/hooks/use-teachers";
import { teacherSchema } from "@/lib/validation/teacher-schema";
import type { TeacherInput } from "@/types/teacher";

const DEFAULT_VALUES: TeacherInput = {
  fullName: "",
  email: "",
  phone: "",
  specialtyId: "",
  weeklySessionLoad: 0,
  bio: "",
  status: "active",
  suspendedReason: "",
};

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  teacherId: string | null;
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  mode,
  teacherId,
}: TeacherFormDialogProps) {
  const { data: existingTeacher } = useTeacher(mode === "edit" ? teacherId ?? undefined : undefined);
  const { data: specialties } = useActiveSpecialties();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();

  const form = useForm<TeacherInput>({
    resolver: yupResolver(teacherSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && existingTeacher) {
      form.reset({
        fullName: existingTeacher.fullName,
        email: existingTeacher.email,
        phone: existingTeacher.phone,
        specialtyId: existingTeacher.specialtyId,
        weeklySessionLoad: existingTeacher.weeklySessionLoad,
        bio: existingTeacher.bio ?? "",
        status: existingTeacher.status,
        suspendedReason: existingTeacher.suspendedReason ?? "",
      });
    } else if (mode === "create") {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, mode, existingTeacher, form]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: TeacherInput) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
        toast.success(`Đã thêm giảng viên "${values.fullName}".`);
      } else if (teacherId) {
        await updateMutation.mutateAsync({ id: teacherId, input: values });
        toast.success(`Đã cập nhật giảng viên "${values.fullName}".`);
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
          <DialogTitle>{mode === "create" ? "Thêm giảng viên" : "Chỉnh sửa giảng viên"}</DialogTitle>
          <DialogDescription>
            Nhập thông tin hồ sơ giảng viên. Các trường có dấu * là bắt buộc.
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
                      <Input type="email" placeholder="teacher@center.edu.vn" {...field} />
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
                name="specialtyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chuyên môn *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chuyên môn" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties?.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weeklySessionLoad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số buổi dạy/tuần *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={40}
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Kinh nghiệm, ghi chú thêm..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? "Đang lưu..." : mode === "create" ? "Thêm giảng viên" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
