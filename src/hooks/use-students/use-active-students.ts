import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

/** Danh sách học viên đang hoạt động — dùng cho dropdown "chọn tôi là học viên nào" ở trang tự đăng ký. */
export function useActiveStudents() {
  return useQuery({
    queryKey: ["students", "active-list"],
    queryFn: () => db.students.where("status").equals("active").sortBy("fullName"),
  });
}
