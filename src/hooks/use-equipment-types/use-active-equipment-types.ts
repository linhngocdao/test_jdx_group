import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

/** Danh sách loại thiết bị đang hoạt động — dùng cho checkbox chọn trang thiết bị phòng học. */
export function useActiveEquipmentTypes() {
  return useQuery({
    queryKey: ["equipment-types", "active-list"],
    queryFn: () => db.equipmentTypes.where("status").equals("active").sortBy("name"),
  });
}
