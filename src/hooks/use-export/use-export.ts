import { useMutation } from "@tanstack/react-query";

import { exportCourseStudentList, exportTeacherSchedule } from "@/lib/export/export-reports";

export function useExportCourseStudents() {
  return useMutation({
    mutationFn: (courseId: string) => exportCourseStudentList(courseId),
  });
}

export function useExportTeacherSchedule() {
  return useMutation({
    mutationFn: (teacherId: string) => exportTeacherSchedule(teacherId),
  });
}
