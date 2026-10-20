# Tháp Chăm AI

Học cụ 3D tương tác về tháp Chăm (Lịch sử 10 – Bài 16), tích hợp **Trợ lý AI trả lời theo tư liệu** và trò chơi **Thám tử sử liệu** (học sinh kiểm chứng nhận định, kể cả lỗi của chính AI).

- App học sinh: https://khuu97.github.io/thapcham-ai
- Thống kê giáo viên: https://khuu97.github.io/thapcham-ai/thongke.html (cần mã giáo viên)
- Máy chủ: Supabase Edge Function `thapcham-ai` (khu dữ liệu riêng `thapcham`, tách khỏi app Quản lí học tập), gọi Gemini.
  Bí mật cần có: `GEMINI_API_KEY`.
- Bộ tư liệu AI được phép dùng: mảng `TU_LIEU` trong `supabase/functions/thapcham-ai/index.ts`.
- Nhận định Thám tử sử liệu: mảng `CLAIMS` trong `chat.js`.

Tác giả: Chamalé Khữu – Einstein School HCMC.
