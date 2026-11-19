-- Version 2: coding problems.
-- A coding attempt is saved as a test of kind 'coding' with one answer row.
alter table tests drop constraint tests_kind_check;
alter table tests add constraint tests_kind_check
  check (kind in ('topic_quiz', 'level_exam', 'review', 'coding'));

-- Coding problems need a short name, like "Write your own map".
alter table questions add column title text;
