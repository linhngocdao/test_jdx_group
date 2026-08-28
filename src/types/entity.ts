/** Trạng thái hoạt động dùng chung cho mọi hồ sơ (giảng viên, học viên, phòng học). */
export type EntityStatus = "active" | "suspended";

/** Field nền tảng mà mọi entity CRUD trong hệ thống đều có. */
export interface BaseEntity {
  id: string;
  status: EntityStatus;
  /** Lý do tạm ngưng (nghỉ dài hạn, đang sửa, bảo lưu...). */
  suspendedReason?: string;
  createdAt: number;
  updatedAt: number;
}

/** Kết quả phân trang chuẩn hoá trả về từ mọi query danh sách. */
export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
}

/** Tham số phân trang + sắp xếp + tìm kiếm dùng chung cho mọi query danh sách. */
export interface ListQueryParams {
  pageIndex: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/** Kết quả kiểm tra ràng buộc trước khi xoá 1 hồ sơ. */
export interface DeleteGuardResult {
  canDelete: boolean;
  /** Danh sách lý do/ràng buộc đang giữ hồ sơ này lại, hiển thị cho người dùng. */
  blockers: string[];
}
