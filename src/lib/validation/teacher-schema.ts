import * as yup from "yup";

import type { TeacherInput } from "@/types/teacher";

export const teacherSchema: yup.ObjectSchema<TeacherInput> = yup.object({
  fullName: yup.string().trim().required("Vui lòng nhập họ tên").min(2, "Họ tên quá ngắn"),
  email: yup.string().trim().required("Vui lòng nhập email").email("Email không hợp lệ"),
  phone: yup
    .string()
    .trim()
    .required("Vui lòng nhập số điện thoại")
    .matches(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  specialty: yup
    .mixed<TeacherInput["specialty"]>()
    .oneOf(["frontend", "backend", "mobile", "data", "design", "other"])
    .required("Vui lòng chọn chuyên môn"),
  weeklySessionLoad: yup
    .number()
    .typeError("Phải là số")
    .min(0, "Không được âm")
    .max(40, "Tối đa 40 buổi/tuần")
    .required("Vui lòng nhập số buổi dạy/tuần"),
  bio: yup.string().trim().optional(),
  status: yup.mixed<TeacherInput["status"]>().oneOf(["active", "suspended"]).required(),
  suspendedReason: yup.string().trim().optional(),
});
