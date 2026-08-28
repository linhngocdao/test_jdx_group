import * as XLSX from "xlsx";

export interface ExcelColumn<T> {
  header: string;
  getValue: (row: T) => string | number;
}

/**
 * Xuất dữ liệu ra file .xlsx thật (cột tách riêng theo cấu trúc sheet, không
 * phụ thuộc app đọc có tự nhận đúng dấu phẩy làm delimiter hay không như
 * .csv) và tải về ngay trên trình duyệt. Dùng chung cho mọi báo cáo trong
 * app (danh sách học viên 1 khoá, lịch dạy 1 giảng viên...). Tiếng Việt hiển
 * thị đúng vì .xlsx luôn lưu text dạng UTF-8 trong XML nội bộ.
 */
export function downloadExcel<T>(filename: string, rows: T[], columns: ExcelColumn<T>[]): void {
  const headerRow = columns.map((col) => col.header);
  const dataRows = rows.map((row) => columns.map((col) => col.getValue(row)));

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  worksheet["!cols"] = columns.map((col) => ({
    wch: Math.max(col.header.length, 16),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dữ liệu");

  const finalName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}
