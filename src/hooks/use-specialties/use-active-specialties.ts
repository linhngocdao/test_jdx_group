import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

/** Danh sách chuyên môn đang hoạt động — dùng cho dropdown chọn chuyên môn giảng viên. */
export function useActiveSpecialties() {
  return useQuery({
    queryKey: ["specialties", "active-list"],
    queryFn: () => db.specialties.where("status").equals("active").sortBy("name"),
  });
}
