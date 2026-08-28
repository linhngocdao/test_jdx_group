"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Database,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useClearDatabase, useSeedDatabase } from "@/hooks/use-seed-data";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/teachers", label: "Giảng viên", icon: GraduationCap },
  { href: "/students", label: "Học viên", icon: Users },
  { href: "/rooms", label: "Phòng học", icon: DoorOpen },
  { href: "/courses", label: "Khoá học", icon: BookOpen },
  { href: "/enroll", label: "Đăng ký học", icon: ClipboardList },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function HrNav() {
  const pathname = usePathname();
  const seedMutation = useSeedDatabase();
  const clearMutation = useClearDatabase();

  return (
    <header className="border-b bg-background">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-tight">
            Trung tâm đào tạo
          </span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("gap-2", isActive && "font-medium")}
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              seedMutation.mutate(undefined, {
                onSuccess: () => toast.success("Đã sinh dữ liệu mẫu."),
                onError: () => toast.error("Không thể sinh dữ liệu mẫu."),
              });
            }}
            disabled={seedMutation.isPending}
          >
            <Database className="size-4" />
            {seedMutation.isPending ? "Đang sinh..." : "Sinh dữ liệu mẫu"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearMutation.mutate(undefined, {
                onSuccess: () => toast.success("Đã xoá toàn bộ dữ liệu."),
                onError: () => toast.error("Không thể xoá dữ liệu."),
              });
            }}
            disabled={clearMutation.isPending}
          >
            <Trash2 className="size-4" />
            Xoá dữ liệu
          </Button>
        </div>
      </div>
    </header>
  );
}
