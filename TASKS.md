# TASKS.md

The build plan for the interview-prep app. Read CLAUDE.md first; it holds the rules. This file holds the order of work.

## How to use this file

- Work top to bottom. Do not start a task until the one before it is done.
- Tick a task (`[x]`) only when its "Done when" is true.
- Tasks marked **OWNER** are for the owner. Stop and ask them, and wait until they confirm.
- At every **STOP**, finish the version: run `npm run lint`, `npm run test` and `npm run build`, then give the owner the version's checklist. Do not start the next version until the owner says so. They use each version for about a week first.
- If a task turns out to need something CLAUDE.md does not allow, ask before doing it.
- If you change a rule while building, update CLAUDE.md in the same commit.

---

## Version 1: Study and quiz

Goal: the owner can log in, read the syllabus, study Level 1 topics, write notes, and take topic quizzes with multiple choice and output questions, graded by the app.

In version 1 a topic quiz has 12 questions: 9 multiple choice and 3 output. The 3 written questions are added in version 3, when AI grading exists.

### 1.1 Project setup

- [x] Create the Next.js app: App Router, TypeScript strict, ESLint, `src/` not used (folders as in CLAUDE.md), npm.
- [x] Add Tailwind CSS 4 and daisyUI 5, configured in the CSS file as the current daisyUI docs show. Pick one light daisyUI theme.
- [x] Add Vitest with one passing example test, and the `test` script.
- [x] Add Zod.
- [x] Add `.env.example` with every variable from CLAUDE.md, and make sure `.env.local` is git-ignored.
- [x] Add a short `README.md`: what the app is, how to run it, how to seed.

Done when: `npm run dev` shows a daisyUI-styled page, and lint, test and build pass.

### 1.2 Supabase project (OWNER)

- [x] **OWNER:** Create a Supabase project on the free plan.
- [x] **OWNER:** In Authentication settings, turn off new sign-ups. Create the one user account (email and password).
- [x] **OWNER:** Put the project URL, anon key and service role key into `.env.local`.
- [x] Explain to the owner, in a few short steps, where each of these settings is in the Supabase dashboard.

Done when: the owner confirms the keys are in `.env.local`.

### 1.3 Database

- [x] Write the first migration with all seven tables from CLAUDE.md, with foreign keys, `not null` where it makes sense, and check constraints for the enum-like columns.
- [x] Add indexes on foreign keys and on `answers(question_id)`, `tests(finished_at)`.
- [x] Turn on Row Level Security for every table. Policies: `authenticated` can read everything; can insert and update `notes`, `tests` and `answers`; content tables are read-only.
- [x] Apply the migration to the Supabase project. If the Supabase CLI is needed, explain the one or two commands to the owner.

Done when: the tables exist in Supabase with RLS on, and an anonymous request cannot read any table.

### 1.4 Supabase clients and login

- [x] Add server and browser Supabase clients in `lib/supabase`, following the current Supabase guide for Next.js App Router.
- [x] Build `/login` with a daisyUI card: email, password, error message.
- [x] Protect every route except `/login`, following the current Next.js and Supabase docs (middleware or proxy, whichever the current versions use).
- [x] Add a logout button in the navbar.

Done when: logged out, every page redirects to `/login`; logged in, pages load; logout works.

### 1.5 Syllabus content

- [x] Create `content/syllabus.json` from the syllabus doc: track "JavaScript", 7 levels, 46 topics in order, each with title, interview question and a javascript.info reference URL.
- [x] Write Zod schemas for the syllabus and question files in `lib/content/schema.ts`.

Done when: the file validates against the schema and has 7 levels and 46 topics.

### 1.6 Level 1 question bank

- [x] Generate `content/questions/level-1.json` for the 7 Level 1 topics: per topic 9 multiple choice (3 easy, 3 medium, 3 hard), 3 output (1 of each), 3 written with 3 to 5 key points (1 of each). About 105 questions.
- [x] Rules for good questions: one clearly correct option; plausible wrong options; output snippets that run in plain JavaScript and print exactly the stored answer; no trick wording. Verify every output answer by running the snippet with Node.
- [ ] **OWNER:** Spot-check the file: read every hard and written question; skim the easy ones. Fix or flag anything wrong.

Done when: the file validates, every output snippet was run, and the owner has approved it.

### 1.7 Seed script

- [x] Write `scripts/seed.ts` and the `seed` script: validate `content/` with Zod, then upsert tracks, levels, topics and questions using the service role key. Running it twice must not duplicate anything.
- [x] Print a short summary: counts per level and per question type.

Done when: `npm run seed` loads Level 1 and running it again changes nothing.

### 1.8 Layout

- [x] Root layout with a daisyUI navbar: Syllabus, Mistakes, History (the last two can show "Coming in a later version" for now), logout.
- [x] Responsive: usable on a phone.

Done when: every page shares the layout and looks fine at phone width.

### 1.9 Syllabus page

- [x] `/syllabus`: every level as a section, every topic as a row with its status: not started, studied (has notes or a quiz), or quiz score (best and last).
- [x] Levels without questions in the database show "Questions not added yet". Level unlocking comes in version 4; for now every level with questions is open.
- [x] `/` redirects to `/syllabus` until the dashboard exists in version 5.

Done when: the page shows Level 1 topics with correct statuses after taking a quiz.

### 1.10 Topic page

- [x] `/topic/[id]`: title, the interview question in a highlighted card, a link to the reference chapter, a "Start quiz" button, and links to the previous and next topic.
- [x] Notes box that saves automatically about 1 second after the owner stops typing, with a small "Saved" indicator.

Done when: notes survive a page reload, and the quiz button starts a quiz for that topic.

### 1.11 Question selection and scoring logic

- [x] `lib/selection`: a pure function that builds a topic quiz from a topic's questions: all multiple choice and output questions (written ones excluded until version 3), ordered easy, medium, hard.
- [x] `lib/scoring`: pure functions to grade multiple choice, grade output (trim and collapse whitespace), and compute a test score as described in CLAUDE.md.
- [x] Vitest tests for both, including edge cases: extra spaces in output answers, a test with zero questions, mixed results.

Done when: the tests pass.

### 1.12 Test page

- [x] Starting a quiz creates a `tests` row (`topic_quiz`, `in_progress`) and its question list.
- [x] `/test/[id]`: one question at a time with a progress bar, previous and next buttons, and a "Finish" button on the last question. Multiple choice uses radio options; output uses a text input.
- [x] Answers are saved as the owner goes, so a reload does not lose them.
- [x] Finishing grades every answer with `lib/scoring`, saves `answers` (`graded_by = app`) and the test score, sets status `graded`, and opens the results page.

Done when: a full quiz can be taken, reloaded halfway, and finished.

### 1.13 Results page

- [x] `/results/[id]`: the score at the top, then every question with the owner's answer, the correct answer, and right or wrong.
- [x] A link back to the topic and to the next topic.

Done when: results match the answers given.

### 1.14 Version 1 check

- [x] Lint, test and build pass.
- [x] Give the owner this checklist to try: log in; open the syllabus; open topic 1 and write a note; reload and see the note; take the quiz; reload in the middle; finish; read the results; see the score on the syllabus page; log out.

### 1.15 Owner feedback

- [x] Fix: the first click on Next or Finish after typing an answer was lost.
- [x] "I don't know" option on multiple choice and output questions (scores 0).
- [x] `explanation` for every multiple choice and output question, shown on the results page for wrong answers (new migration).
- [x] Cheat sheet on the topic page: the key points of the topic's written questions.

**STOP. Version 1 is done. Wait for the owner.**

---

## Version 2: Coding problems

Goal: on coding days, the owner writes the coding ladder functions in an editor and runs tests in the browser.

- [x] Add `coding` to the allowed values of `tests.kind` (new migration) and update CLAUDE.md.
- [x] Create `content/coding.json` with the 30 coding ladder functions from the syllabus: each with a title, description, difficulty, the closest topic, starter code, and 4 to 8 test cases including an empty input and an edge case. Start with the 10 easy ones; add medium and hard ones before the owner reaches them. Part 2 (the 15 DSA problems, 31 to 45) goes in the same file later, with its LeetCode link.
- [x] **OWNER:** Spot-check the easy functions and their tests.
- [x] Extend the seed script and schema to load coding questions.
- [x] Web Worker runner in `lib/runner`: runs the owner's code against the test cases, supports async tests, stops after 3 seconds, returns pass or fail with expected and actual values.
- [x] Vitest tests for the runner's comparison logic (deep equality, async results, thrown errors).
- [x] CodeMirror 6 editor component with JavaScript highlighting and Tab indentation.
- [x] Coding page: description, editor with starter code, a 20 minute countdown (warning only, does not block), "Run tests" and "Submit". Submitting saves a `coding` test and its score.
- [x] A "Coding ladder" list page showing every coding problem (ladder and part 2) with status, and a link to it in the navbar.
- [x] Version 2 check: lint, test, build, and an owner checklist (write `map`, run tests, fail one on purpose, submit, see the result, write an infinite loop and see the timeout).

**STOP. Version 2 is done. Wait for the owner.**

---

## Version 3: AI grading

Goal: written answers and code get graded and reviewed by Gemini, with Groq as the fallback.

- [x] **OWNER:** Create a Gemini API key in Google AI Studio and a Groq API key in the Groq console. Put them, and the chosen model names, into `.env.local`.
- [x] `lib/grading/schema.ts`: Zod schema for the AI response, as described in CLAUDE.md.
- [x] `lib/grading/prompt.ts`: one prompt builder for all written and coding answers of a test.
- [x] `lib/grading/gemini.ts` and `lib/grading/groq.ts`, server only.
- [x] `gradeAnswers()`: Gemini first; on any error or invalid JSON, Groq; if both fail, return a failure. Never one request per answer.
- [x] Vitest tests for `gradeAnswers()` with both providers mocked: Gemini works; Gemini fails and Groq works; both fail; invalid JSON.
- [x] Add the 3 written questions to topic quizzes (now 15 questions, easy to hard). Written answers use a textarea.
- [x] Finishing a test with written or coding answers: save app-graded answers first, set status `waiting_for_grading`, call `gradeAnswers()`, then save scores, feedback and `graded_by`, and set status `graded`.
- [x] Retry: when the results page or the syllabus page loads and a test is `waiting_for_grading`, try grading it again.
- [x] Results page shows, for each written answer: score, key points covered and missed, mistakes, model answer. For code: edge cases and the suggestion. Show "Waiting for grading" when needed.
- [x] Version 3 check: lint, test, build, and an owner checklist (answer a written question well and badly, see different scores; remove the Gemini key and check that Groq grades; remove both keys and check "waiting for grading", then restore keys and see it graded).

**STOP. Version 3 is done. Wait for the owner.**

---

## Version 4: Level exams and review exams

Goal: the full exam system, with unlocking and the 3-day review.

- [x] `lib/selection`: level exam (15 questions: 8 multiple choice, 3 output, 3 written, 1 coding; medium and hard only; from the level's topics) and review exam (10 questions: about 6 from weak topics, 4 random; 6 multiple choice or output, 3 written, 1 coding; mixed difficulty). Both prefer questions answered wrong, then ones not answered for the longest time. Order easy to hard.
- [x] `lib/scoring`: level unlocked, level exam available, retake allowed (24 hours after a fail), review due (3 days after the last review), review overdue, weak topics.
- [x] Vitest tests for every rule above, with fixed dates.
- [x] Timer on the test page for exams (40 minutes for level, 30 for review). When time runs out, the test is finished with the answers given.
- [x] Level exam button on the syllabus page when available. Locked levels show a lock and what is needed to unlock them.
- [x] Review exam: a clear banner when due. While overdue, starting a topic quiz is blocked with a message and a button to the review exam.
- [x] Version 4 check: lint, test, build, and an owner checklist (use a temporary date override in development to test the 3-day and 24-hour rules, then remove it).

**STOP. Version 4 is done. Wait for the owner.**

---

## Version 5: Dashboard, tracking and deployment

Goal: one place that says what to do today and shows weak spots; the app online.

- [x] `lib/scoring`: streak (Asia/Dhaka days) and day type (quiz day or coding day, alternating from the last completed daily task; a due review comes first). Vitest tests.
- [x] Dashboard at `/`: today's task as one big button, current level, streak, days to next review, top 5 weak topics.
- [x] `/mistakes`: every wrong or low-scored answer (under 70%), newest first, filterable by level and topic, with the correct or model answer.
- [x] `/history`: all tests with date, kind, score and a link to results.
- [ ] **OWNER:** Create a Vercel project from the repository and add the environment variables. Explain the steps briefly.
- [ ] Deploy, then check login, a quiz and AI grading on the live site.
- [ ] Version 5 check: lint, test, build, and an owner checklist covering the dashboard, mistakes and history on the live site, on a phone.

**STOP. Version 5 is done. The app is complete.**

---

## Ongoing: question banks for Levels 2 to 7

Do one level at a time, about a week before the owner reaches it in the syllabus. Ask the owner which level is next.

- [x] Level 2 question bank, owner spot-check, seed
- [x] Level 3 question bank, owner spot-check, seed
- [x] Level 4 question bank, owner spot-check, seed
- [x] Level 5 question bank, owner spot-check, seed
- [x] Level 6 question bank, owner spot-check, seed
- [x] Level 7 question bank, owner spot-check, seed
- [x] Medium coding functions (11 to 23), owner spot-check, seed
- [x] Hard coding functions (24 to 30), owner spot-check, seed
- [x] Trim (Nov 23): syllabus to 37 topics in 6 levels (CORS added, Level 7 removed), coding ladder to 12 functions, DSA list to 12. Removed rows are deleted by the seed.
- [ ] Coding ladder part 2: the 12 DSA problems (13 to 24) from the syllabus, owner spot-check, seed. Tree problems need a small helper in the starter code that builds a tree from an array, so test cases stay plain JSON

Use the same rules as task 1.6. Run every output snippet with Node before saving.
