-- Content tables: written only by the seed script (service role).
create table tracks (
  id   text primary key,
  name text not null
);

create table levels (
  id       text primary key,
  track_id text not null references tracks(id),
  number   int  not null,
  title    text not null,
  unique (track_id, number)
);

create table topics (
  id                 text primary key,
  level_id           text not null references levels(id),
  position           int  not null,
  title              text not null,
  interview_question text not null,
  reference_url      text not null,
  unique (level_id, position)
);

create table questions (
  id             text primary key,
  topic_id       text not null references topics(id),
  type           text not null check (type in ('mcq', 'output', 'written', 'coding')),
  difficulty     text not null check (difficulty in ('easy', 'medium', 'hard')),
  prompt         text not null,
  options        jsonb,
  correct_answer text,
  key_points     jsonb,
  test_cases     jsonb,
  starter_code   text
);

-- Owner data.
create table notes (
  topic_id   text primary key references topics(id),
  body       text not null default '',
  updated_at timestamptz not null default now()
);

create table tests (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('topic_quiz', 'level_exam', 'review')),
  topic_id    text references topics(id),
  level_id    text references levels(id),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  score       numeric check (score between 0 and 100),
  status      text not null default 'in_progress'
              check (status in ('in_progress', 'waiting_for_grading', 'graded'))
);

-- One row per question in a test, created when the test starts.
create table answers (
  id          uuid primary key default gen_random_uuid(),
  test_id     uuid not null references tests(id) on delete cascade,
  question_id text not null references questions(id),
  response    text,
  is_correct  boolean,
  score       numeric check (score between 0 and 1),
  feedback    jsonb,
  graded_by   text check (graded_by in ('gemini', 'groq', 'app')),
  unique (test_id, question_id)
);

create index on levels (track_id);
create index on topics (level_id);
create index on questions (topic_id);
create index on tests (topic_id);
create index on tests (level_id);
create index on tests (finished_at);
create index on answers (question_id);

-- Row Level Security: only the signed-in owner, no anonymous access.
alter table tracks    enable row level security;
alter table levels    enable row level security;
alter table topics    enable row level security;
alter table questions enable row level security;
alter table notes     enable row level security;
alter table tests     enable row level security;
alter table answers   enable row level security;

create policy "read" on tracks    for select to authenticated using (true);
create policy "read" on levels    for select to authenticated using (true);
create policy "read" on topics    for select to authenticated using (true);
create policy "read" on questions for select to authenticated using (true);
create policy "read" on notes     for select to authenticated using (true);
create policy "read" on tests     for select to authenticated using (true);
create policy "read" on answers   for select to authenticated using (true);

create policy "insert" on notes   for insert to authenticated with check (true);
create policy "update" on notes   for update to authenticated using (true) with check (true);
create policy "insert" on tests   for insert to authenticated with check (true);
create policy "update" on tests   for update to authenticated using (true) with check (true);
create policy "insert" on answers for insert to authenticated with check (true);
create policy "update" on answers for update to authenticated using (true) with check (true);
