import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";
import { normalizeSearchText, simulateLatency } from "@/lib/db/list-query";

const RESULT_LIMIT = 50;

/**
 * Tìm học viên active theo tên/email, giới hạn 50 kết quả — dùng cho dropdown
 * chọn học viên (đăng ký khoá học). KHÔNG dùng cho danh sách đầy đủ, vì với
 * hàng nghìn học viên, render hết vào 1 dropdown làm trình duyệt bị đơ khi
 * mở (đã xác nhận: ~2.6s và giật nặng với ~5000 option cùng lúc).
 */
export function useStudentSearch(search: string) {
  return useQuery({
    queryKey: ["students", "search", search],
    queryFn: async () => {
      await simulateLatency(100);
      const needle = normalizeSearchText(search);

      return db.students
        .where("status")
        .equals("active")
        .filter(
          (student) =>
            !needle ||
            normalizeSearchText(student.fullName).includes(needle) ||
            normalizeSearchText(student.email).includes(needle)
        )
        .limit(RESULT_LIMIT)
        .toArray((students) =>
          students.map((s) => ({ id: s.id, fullName: s.fullName, email: s.email }))
        );
    },
  });
}
