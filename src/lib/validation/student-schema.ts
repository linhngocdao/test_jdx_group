import * as yup from "yup";

import type { StudentInput } from "@/types/student";

export const studentSchema: yup.ObjectSchema<StudentInput> = yup.object({
  fullName: yup.string().trim().required("Vui lòng nhập họ tên").min(2, "Họ tên quá ngắn"),
  email: yup.string().trim().required("Vui lòng nhập email").email("Email không hợp lệ"),
  phone: yup
    .string()
    .trim()
    .required("Vui lòng nhập số điện thoại")
    .matches(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  dateOfBirth: yup
    .number()
    .typeError("Ngày sinh không hợp lệ")
    .required("Vui lòng nhập ngày sinh"),
  address: yup.string().trim().optional(),
  status: yup.mixed<StudentInput["status"]>().oneOf(["active", "suspended"]).required(),
  suspendedReason: yup.string().trim().optional(),
});
