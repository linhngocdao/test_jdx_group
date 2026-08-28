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
import { useCourse, useCreateCourse, useUpdateCourse } from "@/hooks/use-courses";
import { useActiveRooms } from "@/hooks/use-rooms";
import { useActiveTeachers } from "@/hooks/use-teachers";
import { courseSchema } from "@/lib/validation/course-schema";
import type { CourseInput } from "@/types/course";

function toDateInputValue(epochMs: number): string {
  if (!epochMs) return "";
  return new Date(epochMs).toISOString().slice(0, 10);
}

function fromDateInputValue(value: string): number {
  return value ? new Date(value).getTime() : 0;
}

const DEFAULT_VALUES: CourseInput = {
  name: "",
  teacherId: "",
  roomId: "",
  minStudents: 8,
  maxStudents: 20,
  startDate: 0,
  endDate: 0,
  note: "",
};

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  courseId: string | null;
}

export function CourseFormDialog({ open, onOpenChange, mode, courseId }: CourseFormDialogProps) {
  const { data: existingCourse } = useCourse(mode === "edit" ? courseId ?? undefined : undefined);
  const { data: teachers } = useActiveTeachers();
  const { data: rooms } = useActiveRooms();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const form = useForm<CourseInput>({
    resolver: yupResolver(courseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedRoomId = form.watch("roomId");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && existingCourse) {
      form.reset({
        name: existingCourse.name,
        teacherId: existingCourse.teacherId,
        roomId: existingCourse.roomId,
        minStudents: existingCourse.minStudents,
        maxStudents: existingCourse.maxStudents,
        startDate: existingCourse.startDate,
        endDate: existingCourse.endDate,
        note: existingCourse.note ?? "",
      });
    } else if (mode === "create") {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, mode, existingCourse, form]);

  // Gợi ý số tối đa theo sức chứa phòng đã chọn, nếu người dùng chưa tự chỉnh.
  useEffect(() => {
    if (mode !== "create" || !selectedRoomId) return;
    const room = rooms?.find((r) => r.id === selectedRoomId);
    if (room) {
      form.setValue("maxStudents", room.capacity);
    }
  }, [selectedRoomId, rooms, mode, form]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: CourseInput) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
        toast.success(`Đã tạo khoá học "${values.name}".`);
      } else if (courseId) {
        await updateMutation.mutateAsync({ id: courseId, input: values });
        toast.success(`Đã cập nhật khoá học "${values.name}".`);
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
          <DialogTitle>{mode === "create" ? "Tạo khoá học" : "Chỉnh sửa khoá học"}</DialogTitle>
          <DialogDescription>
            Gán giảng viên phụ trách, chọn phòng học và đặt ngày khai giảng. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khoá học *</FormLabel>
                  <FormControl>
                    <Input placeholder="Python cơ bản" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giảng viên phụ trách *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn giảng viên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers?.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
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
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phòng học *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn phòng học" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} (sức chứa {room.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="minStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số học viên tối thiểu *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số học viên tối đa *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày khai giảng *</FormLabel>
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
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày kết thúc dự kiến *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ghi chú thêm..." {...field} />
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
                {isSubmitting ? "Đang lưu..." : mode === "create" ? "Tạo khoá học" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
