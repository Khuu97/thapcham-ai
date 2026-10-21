// ===== CẤU HÌNH THÁP CHĂM AI =====
// Máy chủ Supabase riêng cho Tháp Chăm AI.
// Để trống thì app vẫn chạy, nhưng Trợ lý AI tắt (Thám tử sử liệu vẫn chơi được, không chấm bằng AI).
window.THAPCHAM_CONFIG = {
  API_URL: 'https://aiyfdqaimzpdrkpixacv.supabase.co/functions/v1/thapcham-ai',
  // Khóa anon công khai, dùng với cổng Edge Function yêu cầu JWT.
  API_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpeWZkcWFpbXpwZHJrcGl4YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NjkzNjUsImV4cCI6MjEwODE0NTM2NX0.o6B-COFVXponcx0T0HDex6YT7xOxJIZHtTvCtASA-eM'
};
