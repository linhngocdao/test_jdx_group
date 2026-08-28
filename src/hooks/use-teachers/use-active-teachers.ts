import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

/** Danh sách giảng viên đang hoạt động — dùng cho dropdown chọn giảng viên phụ trách khoá học. */
export function useActiveTeachers() {
  return useQuery({
    queryKey: ["teachers", "active-list"],
    queryFn: () => db.teachers.where("status").equals("active").sortBy("fullName"),
  });
}
