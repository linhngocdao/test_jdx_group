"use client";

import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useActiveEquipmentTypes } from "@/hooks/use-equipment-types";
import { useCreateRoom, useRoom, useUpdateRoom } from "@/hooks/use-rooms";
import { roomSchema } from "@/lib/validation/room-schema";
import type { RoomInput } from "@/types/room";

const DEFAULT_VALUES: RoomInput = {
  name: "",
  building: "",
  capacity: 20,
  equipmentTypeIds: [],
  note: "",
  status: "active",
  suspendedReason: "",
};

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  roomId: string | null;
}

export function RoomFormDialog({ open, onOpenChange, mode, roomId }: RoomFormDialogProps) {
  const { data: existingRoom } = useRoom(mode === "edit" ? roomId ?? undefined : undefined);
  const { data: equipmentTypes } = useActiveEquipmentTypes();
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();

  const form = useForm<RoomInput>({
    resolver: yupResolver(roomSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && existingRoom) {
      form.reset({
        name: existingRoom.name,
        building: existingRoom.building,
        capacity: existingRoom.capacity,
        equipmentTypeIds: existingRoom.equipmentTypeIds,
        note: existingRoom.note ?? "",
        status: existingRoom.status,
        suspendedReason: existingRoom.suspendedReason ?? "",
      });
    } else if (mode === "create") {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, mode, existingRoom, form]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: RoomInput) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(values);
        toast.success(`Đã thêm phòng học "${values.name}".`);
      } else if (roomId) {
        await updateMutation.mutateAsync({ id: roomId, input: values });
        toast.success(`Đã cập nhật phòng học "${values.name}".`);
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
          <DialogTitle>{mode === "create" ? "Thêm phòng học" : "Chỉnh sửa phòng học"}</DialogTitle>
          <DialogDescription>
            Nhập thông tin phòng học. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên phòng *</FormLabel>
                    <FormControl>
                      <Input placeholder="P.101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toà nhà *</FormLabel>
                    <FormControl>
                      <Input placeholder="Toà A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sức chứa *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={500}
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
              name="equipmentTypeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trang thiết bị</FormLabel>
                  {(equipmentTypes?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Chưa có loại thiết bị nào. Thêm trong trang Cài đặt.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {equipmentTypes?.map((option) => {
                        const checked = field.value?.includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) => {
                                const current = field.value ?? [];
                                field.onChange(
                                  next
                                    ? [...current, option.id]
                                    : current.filter((item) => item !== option.id)
                                );
                              }}
                            />
                            {option.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? "Đang lưu..." : mode === "create" ? "Thêm phòng học" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
