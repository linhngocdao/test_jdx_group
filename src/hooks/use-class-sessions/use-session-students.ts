import { useQuery } from "@tanstack/react-query";

import { db } from "@/lib/db/dexie-db";

export interface SessionStudentSummary {
  id: string;
  fullName: string;
  email: string;
}

/** Thông tin đầy đủ (tên, email) của các học viên tham gia 1 buổi học cụ thể. */
export function useSessionStudents(studentIds: string[] | undefined) {
  return useQuery({
    queryKey: ["class-sessions", "session-students", studentIds],
    queryFn: async (): Promise<SessionStudentSummary[]> => {
      const students = await db.students.bulkGet(studentIds ?? []);
      return students
        .map((student, index) =>
          student
            ? { id: student.id, fullName: student.fullName, email: student.email }
            : { id: studentIds?.[index] ?? "", fullName: "(Học viên đã xoá)", email: "" }
        )
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
    },
    enabled: Boolean(studentIds && studentIds.length > 0),
  });
}
