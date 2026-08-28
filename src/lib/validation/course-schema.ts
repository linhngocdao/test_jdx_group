import * as yup from "yup";

import type { CourseInput } from "@/types/course";

export const courseSchema: yup.ObjectSchema<CourseInput> = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên khoá học").min(2, "Tên quá ngắn"),
  teacherId: yup.string().trim().required("Vui lòng chọn giảng viên phụ trách"),
  roomId: yup.string().trim().required("Vui lòng chọn phòng học"),
  minStudents: yup
    .number()
    .typeError("Phải là số")
    .min(1, "Tối thiểu phải lớn hơn 0")
    .required("Vui lòng nhập số học viên tối thiểu"),
  maxStudents: yup
    .number()
    .typeError("Phải là số")
    .min(1, "Tối đa phải lớn hơn 0")
    .required("Vui lòng nhập số học viên tối đa")
    .test(
      "max-gte-min",
      "Số tối đa phải >= số tối thiểu",
      (value, ctx) => value === undefined || value >= ctx.parent.minStudents
    ),
  startDate: yup.number().typeError("Ngày khai giảng không hợp lệ").required("Vui lòng chọn ngày khai giảng"),
  endDate: yup
    .number()
    .typeError("Ngày kết thúc không hợp lệ")
    .required("Vui lòng chọn ngày kết thúc dự kiến")
    .test(
      "end-after-start",
      "Ngày kết thúc phải sau ngày khai giảng",
      (value, ctx) => value === undefined || value > ctx.parent.startDate
    ),
  note: yup.string().trim().optional(),
});
