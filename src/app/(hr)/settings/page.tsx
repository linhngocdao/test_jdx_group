"use client";

import {
  useCreateEquipmentType,
  useEquipmentTypeList,
  useRemoveEquipmentType,
  useUpdateEquipmentType,
} from "@/hooks/use-equipment-types";
import {
  useCreateSpecialty,
  useRemoveSpecialty,
  useSpecialtyList,
  useUpdateSpecialty,
} from "@/hooks/use-specialties";

import { CatalogManager } from "./catalog-manager";

const LARGE_PAGE = { pageIndex: 0, pageSize: 200 };

export default function SettingsPage() {
  const specialtyList = useSpecialtyList(LARGE_PAGE);
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const removeSpecialty = useRemoveSpecialty();

  const equipmentTypeList = useEquipmentTypeList(LARGE_PAGE);
  const createEquipmentType = useCreateEquipmentType();
  const updateEquipmentType = useUpdateEquipmentType();
  const removeEquipmentType = useRemoveEquipmentType();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Cài đặt danh mục</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các danh mục dùng trong hồ sơ giảng viên và phòng học — thêm/sửa/xoá tại đây thay
          vì cố định trong code.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <CatalogManager
            title="Chuyên môn giảng dạy"
            description="Dùng khi thêm/sửa hồ sơ giảng viên."
            addLabel="Thêm chuyên môn"
            listQuery={specialtyList}
            createMutation={createSpecialty}
            updateMutation={updateSpecialty}
            removeMutation={removeSpecialty}
          />
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <CatalogManager
            title="Loại trang thiết bị"
            description="Dùng khi thêm/sửa hồ sơ phòng học."
            addLabel="Thêm thiết bị"
            listQuery={equipmentTypeList}
            createMutation={createEquipmentType}
            updateMutation={updateEquipmentType}
            removeMutation={removeEquipmentType}
          />
        </div>
      </div>
    </div>
  );
}
