# CLAUDE.md

A personal JavaScript interview-prep web app. One user (the owner) studies a fixed syllabus topic by topic, takes quizzes, passes level exams to unlock the next level, takes a review exam every 3 days, and gets written answers and code graded by AI.

The owner is a frontend developer preparing for interviews. **Claude Code builds and maintains this app; the owner only uses it.** Their time goes to studying, so keep the app small, reliable and easy to run.

Full spec: https://claude.ai/artifact/HgwkgvG2VVdMk1MbKxxGTn
Syllabus (levels, topics, coding ladder): https://claude.ai/artifact/61Qa6DUXTS75EnrNL1H9oB

## The one rule

If a feature does not make the owner practise more or show a weak spot, do not build it. No social features, no gamification, no analytics pages, no notifications, no theming work. When in doubt, ask instead of adding.

## Current version

**Version 4.** Build only what the current version lists, then stop. The owner uses each version for at least a week before asking for the next.

| Version | Scope                                                                                                                              |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Syllabus page, topic pages, notes, topic quiz with multiple choice and output questions (app-graded). Level 1 question bank seeded |
| 2       | Coding problems: CodeMirror editor, 20 minute timer, tests running in a Web Worker                                                 |
| 3       | AI grading for written answers and code review (Gemini, Groq fallback), results page, "waiting for grading" retry                  |
| 4       | Level exams with unlocking, review exam every 3 days, overdue lock                                                                 |
| 5       | Dashboard, weak topics, mistakes log, history, deploy to Vercel                                                                    |

Update the "Current version" line above when the owner starts a new version.

## Stack

- Next.js (App Router), TypeScript in strict mode, npm
- Supabase: PostgreSQL database and Supabase Auth
- Tailwind CSS 4 with daisyUI 5. Use daisyUI components and classes; no custom design system, no other UI library
- CodeMirror 6 for the code editor (version 2)
- Zod for validating the question bank and AI responses
- Vitest for unit tests
- Gemini API (primary) and Groq (fallback) for grading, server side only
- Hosting: Vercel

Do not add Redux, Prisma, an ORM, a component library, or a state library. Ask before adding any new dependency. Check the current docs of Supabase, daisyUI, Gemini and Groq before writing integration code; their APIs change.

## Folder structure

```
app/                     routes (see Screens)
components/              small UI pieces, daisyUI based
  ui/                    shared parts like shadcn: Card, CardBody, CardTitle, Badge, Notice, BulletList, Callout
lib/
  supabase/              server and browser clients
  scoring/               pure functions: scores, pass rules, weak topics, streak, day type
  selection/             pure functions: which questions go into each test
  grading/               gradeAnswers(), gemini.ts, groq.ts, prompt.ts, schema.ts
  runner/                Web Worker code runner (version 2)
content/questions/       question bank, one JSON file per level: level-1.json, ...
content/syllabus.json    tracks, levels, topics
content/coding.json      coding ladder: prompt, starter code, reference solution, test cases
content/explain.json     cheat-sheet line -> static explanation page in public/explain/
content/links.json       extra reading links per topic, shown next to the javascript.info link
public/explain/          static .html explanation pages, linked from the topic cheat sheet
supabase/migrations/     SQL migrations
scripts/seed.ts          loads content/ into Supabase
```

## Screens

| Route           | Purpose                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| `/`             | Dashboard: today's task, current level, streak, days to next review, top 5 weak topics  |
| `/syllabus`     | Levels and topics with status: locked, not started, studied, quiz score                 |
| `/topic/[id]`   | Interview question, notes box (autosave), key-points cheat sheet (closed by default), javascript.info link, quiz and coding buttons |
| `/test/[id]`    | One page for topic quiz, level exam and review exam. One question at a time, timer      |
| `/results/[id]` | Score, each answer with feedback and model answer, or "waiting for grading". For coding: tests, your code, model solution |
| `/coding`       | Coding ladder: every coding problem in order with its best score                        |
| `/coding/[id]`  | One coding problem: editor, timer of 20 minutes or 35 for hard ones (warning only), Run tests, Submit |
| `/mistakes`     | Every wrong answer, filterable by level and topic                                       |
| `/history`      | All past tests with date, type and score                                                |
| `/login`        | Supabase email login                                                                    |

## Data model

Seven tables. Anything that can be calculated (unlocked levels, weak topics, streak, review due, day type) is calculated in queries or in `lib/scoring`, never stored.

| Table       | Columns                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tracks`    | id, name                                                                                                                                                                                     |
| `levels`    | id, track_id, number, title                                                                                                                                                                  |
| `topics`    | id, level_id, position, title, interview_question, reference_url                                                                                                                             |
| `questions` | id, topic_id, type (`mcq`, `output`, `written`, `coding`), difficulty (`easy`, `medium`, `hard`), title (coding only), prompt, options (json), correct_answer, explanation, key_points (json), test_cases (json), starter_code |
| `notes`     | topic_id, body, updated_at                                                                                                                                                                   |
| `tests`     | id, kind (`topic_quiz`, `level_exam`, `review`, `coding`), topic_id, level_id, started_at, finished_at, score, status (`in_progress`, `waiting_for_grading`, `graded`)                                 |
| `answers`   | id, test_id, question_id, response, is_correct, score, feedback (json), graded_by (`gemini`, `groq`, `app`)                                                                                  |

- Every schema change is a migration in `supabase/migrations/`.
- Row Level Security is on for every table. Only the `authenticated` role can read or write. Content tables (`tracks`, `levels`, `topics`, `questions`) are read-only for the app; only the seed script writes them, with the service role key.
- Sign-ups are disabled in Supabase. There is exactly one account.

## Question bank

- Source of truth is `content/questions/level-N.json`, committed to git. The database is a copy loaded by `npm run seed`, so nothing important lives only in Supabase (free projects pause after a week of inactivity).
- Per topic: 15 questions. 9 multiple choice (3 easy, 3 medium, 3 hard), 3 output prediction and 3 written (1 easy, 1 medium, 1 hard each). Written questions have 3 to 5 key points. Multiple choice and output questions have a 1 to 2 sentence `explanation`, shown on the results page when the answer is wrong.
- Coding questions come from the syllabus coding ladder (12 functions), each with starter code and test cases. The syllabus has 37 topics in 6 levels.
- Removing content: delete it from `content/`; `npm run seed` then deletes the matching rows, and stops instead if any of the owner's tests, answers or notes still use them.
- Multiple choice options are stored with the correct one first. The quiz page shuffles them per attempt with `seededShuffle` (`lib/selection/shuffle.ts`), seeded by test id and question id.
- Coding problems live in `content/coding.json`. Each test case is a JavaScript expression run next to the owner's code; its result must deep-equal `expected`. `correct_answer` holds a reference solution and `explanation` says how it works (both shown on the results page after a submit), and `npm run check-coding` checks that it passes every test and that the starter code fails at least one.
- A coding attempt is saved as a `coding` test with one answer: the code in `response`, the fraction passed in `score`, and the test results in `feedback.tests`.
- Validate every file with a Zod schema in the seed script. Fail loudly on invalid data.
- When asked to generate questions for a level, write them to the JSON file only. The owner spot-checks them before seeding.

## Test rules

| Test        | Questions                                                                                                                       | Time   | Rule                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Topic quiz  | All 15 of the topic, easy to hard                                                                                               | None   | No pass mark. Score feeds weak topics                                                    |
| Level exam  | 15: 8 multiple choice, 3 output, 3 written, 1 coding. Medium and hard only, from the level's topics                             | 40 min | 70% or more unlocks the next level. Retake allowed 24 hours after a fail                 |
| Review exam | 10 from finished topics: about 6 from weak topics, 4 random. 6 multiple choice or output, 3 written, 1 coding. Mixed difficulty | 30 min | No pass mark. Due 3 days after the last one; while overdue, new topic quizzes are locked |

- Questions in every test are ordered easy to hard.
- Exams pick questions in this order: ones the owner got wrong, then ones not answered for the longest time.
- The level exam becomes available once every topic in the level has a quiz score.
- Level 1 is always unlocked. A topic in a later level also needs its level unlocked (`lib/progress.ts` combines the topic rule below with the level rule).
- The review exam is due 3 days after the last review (or after the first finished quiz) and overdue one day later (`REVIEW_GRACE_HOURS`); only overdue locks topic quizzes. Review questions come from topics with a graded quiz.
- A level without a medium or hard coding problem uses an easy one; a level with no coding problem fills that slot with a multiple choice or output question. `completeTest()` in `lib/complete-test.ts` finishes every quiz and exam; an exam whose time ran out is finished on the next load of its test page.
- `now()` in `lib/now.ts` is the clock for exam rules. In development only, `DEV_NOW` in `.env.local` overrides it to test the 3-day and 24-hour rules.
- Topics unlock in syllabus order: the first topic is always open, and each next topic opens only when the one before it has a best quiz score of 50% or more (`PASS_MARK` in `lib/scoring/unlock.ts`). The first locked topic locks everything after it, across levels.
- The coding ladder unlocks the same way: the next problem opens when the previous one has a submit that passed at least 50% of its tests.
- The coding timer stops at 0:00 and shows "Time is up"; "New timer" restarts it without clearing the code.

## Scoring

All of this lives in `lib/scoring` as pure functions with Vitest tests.

- Every question has equal weight. Test score = average of question scores, as a percentage.
- Multiple choice and output questions offer "I don't know" (`DONT_KNOW` in `lib/scoring`). It scores 0, so an honest gap shows up as a weak spot instead of a lucky guess.
- Multiple choice: 1 or 0.
- Output prediction: 1 if the answer matches the stored output after trimming and collapsing whitespace, else 0.
- Written: AI score from 0 to 10, divided by 10.
- Coding: fraction of test cases passed. The AI review is feedback only and does not change the score.
- A test with ungraded written or coding answers has status `waiting_for_grading` and no final score yet.
- Weak topic: the average of the last 3 answer scores on that topic is under 70%.
- Streak: consecutive days, in the Asia/Dhaka time zone, with at least one finished test.
- Day type: the owner's daily task alternates between a quiz day and a coding day. The next day type is the opposite of the last completed daily task. A due review exam always comes first.

## AI grading

- One server-only function, `gradeAnswers()`, grades all written and coding answers of a test in **one request**. Never one request per answer.
- It calls Gemini first. On any error (including 429), it sends the same request to Groq. If both fail, the test stays `waiting_for_grading` and is retried later (on the next page load of the results or dashboard is fine).
- Both providers get the same prompt: question, stored key points, the answer, and an instruction to grade only against the key points. Ask for JSON and validate it with Zod. On invalid JSON, treat it as a failure and fall back.
- Response per answer: score (0 to 10), key points covered, key points missed, mistakes, short model answer (3 to 5 sentences), and for code: unhandled edge cases and one suggestion.
- Save which provider graded each answer in `answers.graded_by`.
- Both providers are called with plain `fetch` (no SDK): Gemini `generateContent` with `responseJsonSchema`, Groq chat completions with a strict `json_schema`. Default models: `gemini-3.1-flash-lite` and `openai/gpt-oss-120b`, overridden by `GEMINI_MODEL` and `GROQ_MODEL`.
- `gradeTest()` in `lib/grading/grade-test.ts` grades a test's ungraded written and coding answers and sets the final score. It runs when a quiz is finished or code is submitted, and as the retry when the results or syllabus page loads. A blank or "I don't know" written answer scores 0 without an AI call. A written answer scoring 7/10 or more counts as correct.
- API keys are only read on the server. Never import grading code into client components. Never send personal data in prompts.

## Code runner (version 2)

- Runs the owner's function and its test cases in a Web Worker, in the browser. No server-side code execution.
- Kill the worker after 3 seconds and mark the run as a timeout.
- Support async tests (for `Promise.all`, `retry` and similar).
- Show each test case as pass or fail with expected and actual values.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # seed script only, never in app code
GEMINI_API_KEY=
GEMINI_MODEL=                  # empty = gemini-3.1-flash-lite
GROQ_API_KEY=
GROQ_MODEL=
DEV_NOW=                       # development only: pretend it is this time (ISO date) to test exam rules
```

Keep `.env.example` up to date. Never commit `.env.local`.

## Commands

```
npm run dev       # local dev server
npm run build     # production build, must pass before a version is done
npm run lint
npm run test      # Vitest
npm run seed      # validate content/ and load it into Supabase
npm run check-outputs  # run every output snippet with Node
npm run check-coding   # run every coding solution against its tests
```

## How to work

- Work from TASKS.md, top to bottom. Tick tasks as you finish them, and stop at every STOP line.
- Build one version at a time, in small commits. At the end of a version, run lint, tests and build, then give the owner a short checklist to try in the browser.
- Write tests for everything in `lib/scoring`, `lib/selection` and the grading response parser.
- Prefer server components and server actions; use client components only where interaction needs them (test page, editor, notes autosave).
- Keep code plain and readable. No clever abstractions for a one-user app.
- Repeated UI uses the parts in `components/ui/`, and conditional classes use `cn()` from `lib/cn.ts` instead of template strings. Tone props map to full daisyUI class names, because Tailwind only keeps classes it sees written in full.
- Explain decisions to the owner in plain, short English. They are learning, so say what you did and why in a few sentences, without jargon.
- If a request conflicts with the one rule or the cut list in the spec, say so before building it.
