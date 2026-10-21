# Tháp Chăm AI

Học liệu 3D và phòng học rèn quan sát, kiểm chứng nguồn, lập luận về di sản Chăm.

- Học sinh: https://khuu97.github.io/thapcham-ai/hoc-tap.html
- Giáo viên: https://khuu97.github.io/thapcham-ai/hoc-tap.html?teacher=1

## Một hoạt động học

1. Giáo viên rà soát nguồn S1–S5, sáu nhiệm vụ và rubric trước khi dạy.
2. Học sinh nhập mã lớp, đọc thông tin dữ liệu và làm phiếu đầu vào.
3. Quan sát 3D, đọc nguồn và viết kết luận, bằng chứng, giải thích.
4. Nhận phản hồi Gemini theo ba tiêu chí 0–2, sửa bài và đối chiếu hướng dẫn.
5. Hoàn thành sáu nhiệm vụ rồi làm phiếu cuối. Giáo viên xem hai phiên bản, ghi đánh giá và xuất CSV.

AI thực hiện phản hồi bài viết và gợi ý theo tư liệu. Gợi ý nhiệm vụ tiếp theo dùng quy tắc cố định theo tiêu chí yếu; mô hình 3D không được AI trực tiếp nhìn thấy. Mô hình là học liệu tổng hợp, không phải hồ sơ phục dựng chính xác Po Klong Garai.

## Dữ liệu và giới hạn

Mã phiên ngẫu nhiên thay cho họ tên. Nội dung bài gửi tới Gemini và lưu trong schema `thapcham`. Không nhập dữ liệu cá nhân. Phiên học lưu trên trình duyệt; kết thúc trên thiết bị sẽ xóa mã phiên và bản nháp cục bộ, không xóa bài trên máy chủ. Giáo viên quản lý quyền truy cập và thời gian lưu dữ liệu theo kế hoạch lớp học.

Bài nộp được giữ nguyên, mỗi nhiệm vụ tối đa hai phiên bản. Khi AI lỗi hoặc quá tải, bài vẫn lưu và có thể xin phản hồi lại. Điểm AI chỉ tham khảo; giáo viên có quyền ghi điểm và nhận xét riêng, giữ lịch sử. Phiếu đầu–cuối gồm ba câu mỗi phiếu, chưa phải công cụ đánh giá đã được chuẩn hóa. Không suy ra hiệu quả giáo dục chỉ từ lượt truy cập, điểm AI hay khảo sát hài lòng.

## Triển khai

GitHub Pages triển khai từ `main`. `config.js` chỉ chứa endpoint và khóa anon công khai. `GEMINI_API_KEY` nằm trong bí mật Edge Function. Triển khai bốn file TypeScript trong `supabase/functions/thapcham-ai/`; bật xác thực JWT. Migration bổ sung chỉ thay đổi schema `thapcham`, không thay đổi `public`. Mã giáo viên nằm trong `thapcham.cau_hinh`, không đưa lên GitHub.

## Chuẩn bị minh chứng dự thi

Dùng thử với lớp thật sau khi giáo viên duyệt nội dung; thu bài đầu/bản sửa và nhận xét giáo viên; báo cáo số phiên, phạm vi thử nghiệm, lỗi gặp phải và giới hạn. Chỉ sử dụng dữ liệu học sinh đã được phép và ẩn danh trong video/hồ sơ. Chưa có kết quả lớp học thật được xác nhận trong phiên bản này.
