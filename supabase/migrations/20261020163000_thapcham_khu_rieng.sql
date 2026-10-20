-- Đã áp dụng vào dự án Supabase "Quản lí học tập" (rkkbnfrjozsqxnzvxnfk) ngày 20/10/2026.
-- Khu riêng "thapcham": không mở cho anon/authenticated, chỉ hàm Edge thapcham-ai đọc/ghi.
create schema if not exists thapcham;
revoke all on schema thapcham from anon, authenticated;
create table thapcham.hoi_dap (id bigserial primary key, tg timestamptz not null default now(), lop text, phien text, bo_phan text, cau_hoi text not null, tra_loi text, trong_tu_lieu boolean, nguon text);
create index on thapcham.hoi_dap (phien, tg);
create table thapcham.tham_tu (id bigserial primary key, tg timestamptz not null default now(), lop text, phien text, ma text, nhan_dinh text, chon boolean, chon_dung boolean, bang_chung text, diem smallint check (diem between 0 and 2), nhan_xet text);
create index on thapcham.tham_tu (phien, tg);
create table thapcham.su_dung (id bigserial primary key, tg timestamptz not null default now(), lop text, phien text, su_kien text, chi_tiet text);
create table thapcham.khao_sat (id bigserial primary key, tg timestamptz not null default now(), lop text, phien text, loai text not null check (loai in ('truoc','sau')), c1 smallint check (c1 between 1 and 5), c2 smallint check (c2 between 1 and 5), c3 smallint check (c3 between 1 and 5), c4 smallint check (c4 between 1 and 5), y_kien text);
create table thapcham.cau_hinh (khoa text primary key, gia_tri text not null);
insert into thapcham.cau_hinh values ('ma_giao_vien', 'TC' || lpad((floor(random()*1000000))::int::text, 6, '0'));
alter table thapcham.hoi_dap enable row level security;
alter table thapcham.tham_tu enable row level security;
alter table thapcham.su_dung enable row level security;
alter table thapcham.khao_sat enable row level security;
alter table thapcham.cau_hinh enable row level security;
