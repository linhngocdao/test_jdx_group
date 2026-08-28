"use client";

import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCourseEnrollments, useTransitionEnrollmentStatus } from "@/hooks/use-enrollments";
import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "@/types/enrollment";

const STATUS_STYLES: Record<EnrollmentStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-300 bg-red-50 text-red-700",
  completed: "border-slate-300 bg-slate-50 text-slate-600",
};

export function EnrollmentList({
  courseId,
  onEnroll,
}: {
  courseId: string;
  onEnroll: () => void;
}) {
  const { data: enrollments, isLoading } = useCourseEnrollments(courseId);
  const transition = useTransitionEnrollmentStatus();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Danh sách đăng ký</h2>
        <Button size="sm" variant="outline" onClick={onEnroll}>
          <UserPlus className="size-4" />
          Đăng ký học viên
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!isLoading && (enrollments?.length ?? 0) === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Chưa có học viên nào đăng ký.
        </p>
      )}

      {(enrollments?.length ?? 0) > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments?.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{enrollment.studentName}</span>
                      <span className="text-xs text-muted-foreground">{enrollment.studentEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_STYLES[enrollment.enrollmentStatus]}>
                      {ENROLLMENT_STATUS_LABELS[enrollment.enrollmentStatus]}
                    </Badge>
                    {enrollment.cancelReason && (
                      <p className="mt-1 text-xs text-muted-foreground">{enrollment.cancelReason}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {enrollment.enrollmentStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              transition.mutate(
                                { id: enrollment.id, to: "confirmed" },
                                {
                                  onSuccess: ({ rosterSync }) => {
                                    if (rosterSync && rosterSync.skippedDueToConflict.length > 0) {
                                      toast.warning(
                                        `Đã xác nhận đăng ký, nhưng không thể tự thêm vào ${rosterSync.skippedDueToConflict.length} buổi do trùng lịch: ${rosterSync.skippedDueToConflict
                                          .map((s) => s.courseName)
                                          .join(", ")}. Vui lòng kiểm tra lại thủ công.`
                                      );
                                    } else if (rosterSync && rosterSync.addedToSessionCount > 0) {
                                      toast.success(
                                        `Đã xác nhận đăng ký và thêm vào ${rosterSync.addedToSessionCount} buổi học sắp tới.`
                                      );
                                    } else {
                                      toast.success("Đã xác nhận đăng ký.");
                                    }
                                  },
                                  onError: () => toast.error("Không thể xác nhận."),
                                }
                              )
                            }
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              transition.mutate(
                                { id: enrollment.id, to: "cancelled", cancelReason: "Huỷ bởi admin" },
                                {
                                  onSuccess: () => toast.success("Đã huỷ đăng ký."),
                                  onError: () => toast.error("Không thể huỷ."),
                                }
                              )
                            }
                          >
                            Huỷ
                          </Button>
                        </>
                      )}
                      {enrollment.enrollmentStatus === "confirmed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            transition.mutate(
                              { id: enrollment.id, to: "cancelled", cancelReason: "Huỷ bởi admin" },
                              {
                                onSuccess: () => toast.success("Đã huỷ đăng ký."),
                                onError: () => toast.error("Không thể huỷ."),
                              }
                            )
                          }
                        >
                          Huỷ
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
