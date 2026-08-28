import * as yup from "yup";

import type { RoomInput } from "@/types/room";

export const roomSchema: yup.ObjectSchema<RoomInput> = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên phòng"),
  building: yup.string().trim().required("Vui lòng nhập toà nhà"),
  capacity: yup
    .number()
    .typeError("Phải là số")
    .min(1, "Sức chứa phải lớn hơn 0")
    .max(500, "Sức chứa quá lớn")
    .required("Vui lòng nhập sức chứa"),
  equipment: yup
    .array(
      yup
        .mixed<RoomInput["equipment"][number]>()
        .oneOf(["projector", "whiteboard", "computers", "ac"])
        .required()
    )
    .required()
    .default([]),
  note: yup.string().trim().optional(),
  status: yup.mixed<RoomInput["status"]>().oneOf(["active", "suspended"]).required(),
  suspendedReason: yup.string().trim().optional(),
});
