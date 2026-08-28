## Hướng dẫn khởi chạy dự án

### Yêu cầu
- Node.js 18 trở lên

### Các bước chạy dự án

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — ứng dụng redirect vào trang **Tổng quan**. Bấm **"Sinh dữ liệu mẫu"** ở góc phải thanh điều hướng để có ngay dữ liệu demo (giảng viên, học viên, phòng học, khoá học với đủ trạng thái).

Build production: `npm run build && npm run start`.

## Kiến trúc

Next.js (App Router) + TypeScript, không backend — toàn bộ dữ liệu lưu trong **IndexedDB** (Dexie) ở trình duyệt. **TanStack Query** đóng vai trò tầng data-fetching, biến các thao tác Dexie thành CRUD có cache/invalidate/loading state như một API thật. **Zustand** giữ state UI cục bộ (dialog). Form dùng **React Hook Form + Yup**. Bảng dữ liệu lớn dùng **TanStack Table + TanStack Virtual** để ảo hoá hàng chục nghìn dòng.

Code chia theo lớp: `lib/db` (schema Dexie, query phân trang, ràng buộc xoá), `lib/scheduling` (core dùng chung: phát hiện xung đột lịch, vòng đời khoá học, số liệu dashboard), `hooks/` (một hook riêng cho mỗi domain: teachers, students, rooms, courses, enrollments...), `components/data-table` (bảng dùng chung cho mọi module), `app/(hr)/*` (các trang theo module: giảng viên, học viên, phòng học, khoá học, đăng ký, dashboard).
