import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

/** Danh sách phòng học đang hoạt động — dùng cho dropdown chọn phòng khi tạo khoá học/buổi học. */
export function useActiveRooms() {
  return useQuery({
    queryKey: ["rooms", "active-list"],
    queryFn: () => db.rooms.where("status").equals("active").sortBy("name"),
  });
}
