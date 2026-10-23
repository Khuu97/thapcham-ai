-- Tháp Chăm AI: phản hồi trải nghiệm sau phiếu cuối hoạt động.
-- Chỉ sử dụng schema thapcham; không cấp truy cập trực tiếp cho anon/authenticated.
-- Mỗi mã phiên học (token_hash) chỉ được gửi phản hồi một lần.
create table if not exists thapcham.experience_feedback (
 token_hash text primary key references thapcham.learners(token_hash) on delete cascade,
 ease smallint not null check(ease between 1 and 3),
 helpful smallint not null check(helpful between 1 and 4),
 ai_awareness smallint not null check(ai_awareness between 1 and 3),
 comment text not null default '' check(char_length(comment)<=500),
 created_at timestamptz not null default now()
);
alter table thapcham.experience_feedback enable row level security;
revoke all on table thapcham.experience_feedback from anon, authenticated;
comment on table thapcham.experience_feedback is 'Phiếu phản hồi trải nghiệm học sinh (không tính điểm) – một bản ghi/phiên học.';
