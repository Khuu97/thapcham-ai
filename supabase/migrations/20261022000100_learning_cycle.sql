-- Additive: only the thapcham schema. Existing records remain intact.
create table if not exists thapcham.learners(token_hash text primary key, code text not null, lop text not null, created_at timestamptz not null default now());
create table if not exists thapcham.attempts(id uuid primary key, token_hash text not null references thapcham.learners(token_hash), task text not null, version smallint not null check(version in(1,2)), body jsonb not null, feedback jsonb, status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(token_hash,task,version));
create table if not exists thapcham.reviews(id bigserial primary key, attempt_id uuid not null references thapcham.attempts(id), scores jsonb not null, note text not null, created_at timestamptz not null default now());
create table if not exists thapcham.assessments(token_hash text not null references thapcham.learners(token_hash), phase text not null check(phase in('truoc','sau')), answers jsonb not null, score int not null, created_at timestamptz not null default now(), primary key(token_hash,phase));
create table if not exists thapcham.request_limits(bucket text not null, window_start timestamptz not null, n int not null default 1, primary key(bucket,window_start));
create table if not exists thapcham.teacher_sessions(token_hash text primary key, expires_at timestamptz not null);
create index if not exists attempts_time_idx on thapcham.attempts(created_at desc);
create index if not exists reviews_attempt_idx on thapcham.reviews(attempt_id,id desc);
alter table thapcham.learners enable row level security;
alter table thapcham.attempts enable row level security;
alter table thapcham.reviews enable row level security;
alter table thapcham.assessments enable row level security;
alter table thapcham.request_limits enable row level security;
alter table thapcham.teacher_sessions enable row level security;
revoke all on schema thapcham from public,anon,authenticated;
revoke all on all tables in schema thapcham from anon,authenticated;
revoke all on all sequences in schema thapcham from anon,authenticated;
