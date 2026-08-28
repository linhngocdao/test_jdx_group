## Là trung tập với 8 giảng viên 6 phòng học và hơn 200 học viên đang theo học, => quản lý bằng excel
Sự cố xảy ra:
- Giảng viên minh bị xêp dạy lại 2 lớp cùng giờ sáng thứ 3 => huỷ buổi 7:45 sáng 15 học viên đợi rồi ra về
- Phòng b201 bị 2 lớp đăng ký lịch chiều thứ 6 => trnh chấp tại chỗ mối lớp phải 1 lớp ngoài hành lang
- la đăng kts cả khoá A và khó b có buổi trùng giờ => phát hiện khai giảng k xử lý kịp
- khoá học "python cơ bản" khai giảng với 2 người đăng ký tôi thiểu cần 8 => lỗ chi phí + giảng viên bỏ buổi
- k ai biết tháng này giảng viên nào đang có quá tải k => sếp k có dữ liệu đưa ra phân công



Cần làm FE đơn giản k cần backend api hay database  -> lưu trữ phía client

## Công nghệ
- nextjs ts, react query, react hook form, yub, zustand, react-virtual của tanstack


## design system
- đều xử dụng shadUI và custom style bằng tailwind nếu style
- font chữ dùng bevietnampro font

## Quy các code và đặt tên:
- Luôn viết code SOLID DRY hạn chế tối đa trung lặp component

# Vấn đề triển khai các module
### Quản lý hồ sơ nhân sự và phòng học
- Nhần viên CRUD chỉnh sửa và tìm kiếm hồ sơ giảng viên, học viên, phòng học. Danh sách có thể lên đến hàng trăm nghìn bản ghi  => tìm kiếm nhanh và phân trang-
- 1 số hồ sơ đánh dấu tạm ngưng hoạt động (gv nghỉ dài han, phòng đang sửa, học viên bảo lưu) hồ sơ tạm ngừng k được tham gia hoạt động mới
- Khi xoá phải check có đang gán với hoạt động nào chưa kết thúc k và phải thông báo rõ ràng (nếu có)

### Quản lý khóa học và lịch dạy
- Admin tạo khoá học => gán giảng viên phụ trach chọn phòng học đặt ngày khai giảng và lên lịch các buổi học cụ thể trong khoá một khoá học có vòng đời từ khi tạo đến kết thục ứng viên tự xác định giai đoạn cần  luật chuyển đổi giữa chúng và những hành động được phép từng giai đoạn hệ thống phải xử lý đúng trường học  dến ngày khai giảng mà số chưa đnagw ký chưa đạt mức tối thiểu do admin đặt ra => k cần admin can thiệp thủ công

### Ngăn chặn xung đột lịch
- Đây là vấn đề cốt lõi quan trọng cần giải thiết => 3 sự cố lúc đầu tôi đưa ra đều do vấn đề này. hệ thóng phải tự động phát hiện và từ chói khi có bất kì tình hướng trung lịch nào xảy ra với giảng viên phòng học hoặc học viên => từ chối thì phải thông báo lỗi cụ thể xung đợt xảy ra giữa ai với ai lúc nào và ở đâu => thông báo rõ ràng vấn đề

### Đăng ký học viên
- Học viên đọc đăng ký vào các khoá học. Một đăng ký có thể ở nhiều trạng thái khác nhau trong quá trình diễn ra -> ứng viên tự xác định trạng thái cân thiết
- Hệ thống phải check khoá học nào đg nhận đăng ký, học viên nào đủ điều kiện, số lượng k vượt quá phòng chứa và k xung đột lịch
- khi trạng thái thay đổi (khoá học, huỷ khoá học...) các đki phải được xử lý tự động 1 cách hợp lý

### Màn hình tổng quan
- Ban giám đốc cần phải nhìn thấy ngày trạng thái vận hành đây chính là trang dashboard : bao nhiêu khoá đnag mở , đang diễn ra, đã kết thúc; khoá nào  có nguy cơ phải huỷ ví sắp đến ngày khai giảng mà chưa đủ học viên , giảng viên nào đang có lịch quá nhiều

### xuất dữ liệu ra file
admin xuát báo cáo ra file excel ( danh sách học viên của 1 khoá  kèm thog tin liên hệ  trạng thái đăng ký), lịc dạy của 1 giảng viên toàn bộ khoá địa điẻm thời gian

=> phải mở dc file tiếng việt k bị lỗi
