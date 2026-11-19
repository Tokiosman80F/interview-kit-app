# Interview Prep

A personal JavaScript interview-prep app: study the syllabus topic by topic, write notes, and take topic quizzes. See `CLAUDE.md` for the rules and `TASKS.md` for the build plan.

## Run it

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and service role key.
3. Apply the database migration once: open the Supabase dashboard → SQL Editor, paste `supabase/migrations/20261117000000_init.sql`, and run it.
4. `npm run seed` to load the syllabus and question bank.
5. `npm run dev` and open http://localhost:3000

## Content

- `content/syllabus.json`: levels and topics.
- `content/questions/level-N.json`: the question bank, one file per level.
- `content/coding.json`: the coding ladder, with a reference solution and test cases per problem.
- `npm run check-outputs` runs every output-prediction snippet with Node and checks the stored answer.
- `npm run check-coding` runs every reference solution against its tests.
- `npm run seed` validates everything with Zod and upserts it into Supabase. Running it twice changes nothing.

## Checks

`npm run lint`, `npm run test`, `npm run build`
