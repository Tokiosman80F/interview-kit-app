# Interview Prep App: Feature Spec

Nov 17, 2026 · @Toki Osman Nahian

A personal web app where you study the JavaScript syllabus topic by topic, take a quiz on each topic, pass an exam to unlock the next level, and get a mixed review exam every 3 days. Gemini checks written answers and code.

## 1. Goal

The app has one user: you. Its job is to make you answer interview questions out loud and on paper every day, and to show you clearly what you still get wrong.

One rule decides every feature: **if it does not make you practise more or show you a weak spot, it is not built.** No social features, no design polish beyond clean and readable, no admin panel.

The syllabus already exists in the [JavaScript Interview Syllabus](https://claude.ai/artifact/61Qa6DUXTS75EnrNL1H9oB) doc: 7 levels, 46 topics, 30 coding functions. The app is built around that structure, so a React or Node syllabus can be added later as a second track with no new code.

## 2. Features to build

Twelve features in four groups. Everything else is in section 3.

| Group | Feature | What it does |
| --- | --- | --- |
| Study | Syllabus view | Levels and topics in order. Later levels stay locked until you pass the level exam |
| Study | Topic page | The interview question, your notes, a link to the javascript.info chapter, and the topic's coding function |
| Study | My notes | One text box per topic for your own explanation in your own words. Saved automatically |
| Practice | Topic quiz | 15 questions after each topic, easy to hard: 9 multiple choice, 3 output prediction, 3 written answers |
| Practice | Coding problem | A code editor for the day's function, a 20 minute timer, and test cases that run in the browser |
| Exams | Level exam | Unlocks the next level when you pass. Details in section 4 |
| Exams | 3-day review exam | A mixed exam from everything you have finished, weighted toward your weak topics |
| Exams | AI grading | Gemini, or Groq if Gemini is unavailable, grades written answers and code, gives a score, what was missing, and a better answer |
| Tracking | Dashboard | Today's task, current level, streak, days until the next review exam |
| Tracking | Weak topics list | Topics where your average score is under 70%, worst first |
| Tracking | Mistakes log | Every wrong answer with the correct one, so you can reread them before interviews |
| Tracking | Exam history | Every exam with date, score and a link to see your answers again |

The weak topics list and the mistakes log are the most valuable part of the app. They tell you exactly what to study, which no course or website does for you.

## 3. Features cut

These sound useful but cost build time without making you practise more. Leave them out of version 1. A few can come back later, as marked.

| Feature | Why it is cut | Later? |
| --- | --- | --- |
| Sign up, multiple users, roles | You are the only user. Supabase Auth with one account and sign-ups turned off protects the app | Only if you share it |
| Generating new questions with AI during every exam | Uses up the free Gemini quota and the quality is uneven. Questions come from a fixed question bank instead (section 4) | No |
| Running code on a server | Risky and complex. Coding problems are pure functions, so their tests run safely in the browser | No |
| A full "small project" exam, like building an app | Too big to grade in one sitting. Replaced by a 45 minute UI task in the level exams of later levels | In the React track |
| Charts and analytics pages | A weak topics list and a score per level tell you the same thing | Maybe one chart in version 3 |
| Badges, points, leaderboards | Gamification adds work and teaches nothing | No |
| Notifications and emails | You open the app every day anyway as part of your routine | No |
| Voice answers with speech to text | Useful for English practice, but complex. Record yourself with your phone instead | Maybe in version 3 |
| Dark mode, themes, animations | Polish, not practice | Any time, if you want |
| Mobile app | A responsive web page is enough | No |
| Flashcards with full spaced repetition | The 3-day review exam already brings back weak topics. A full algorithm is extra work | No |

## 4. How exams work

All tests use four question types. Two are graded by the app itself, so Gemini is only called where a judgement is needed.

| Question type | Example | Graded by |
| --- | --- | --- |
| Multiple choice | "Which of these values is falsy?" | The app: the answer is stored |
| Output prediction | "What does this snippet print?" | The app: compares your answer with the stored output, ignoring spaces |
| Written explanation | "Explain a closure and give a real example" | Gemini, against the key points stored with the question |
| Coding problem | "Write `debounce(fn, delay)`" | The app runs the test cases in the browser for pass or fail. Gemini reviews the code for quality and edge cases |

### The three kinds of test

| Test | When | Questions | Time limit | Pass rule |
| --- | --- | --- | --- | --- |
| Topic quiz | After you study each topic | 15: 9 multiple choice (3 easy, 3 medium, 3 hard), 3 output and 3 written (1 easy, 1 medium, 1 hard of each) | None | No pass mark. The score feeds the weak topics list |
| Level exam | When every topic in a level has a quiz score | 15: 8 multiple choice, 3 output, 3 written, 1 coding. Medium and hard only | 40 minutes | 70% or more unlocks the next level. If you fail, you can retake it after 24 hours, with your wrong questions included again |
| Review exam | Every 3 days | 10 from all finished topics: about 6 from weak topics, 4 random. 6 multiple choice or output, 3 written, 1 coding. All three difficulties mixed | 30 minutes | No pass mark. If it is overdue, new topic quizzes stay locked until you take it |

The overdue rule is what keeps the 3-day review from being skipped.

### Where the questions come from

A fixed question bank, stored in the database:

- 15 questions per topic, each marked easy, medium or hard: 9 multiple choice (3 of each difficulty), 3 output prediction and 3 written explanations (1 of each). Each written question has 3 to 5 key points.
- The topic quiz uses all 15. Level and review exams reuse them: first the questions you got wrong, then the ones you have not answered for the longest time.
- That is about 690 questions for the 46 topics, about 105 for Level 1.
- You generate them with AI, one level at a time, as a JSON file. Spot-check them before you start that level: read every hard and written question closely, and skim the easy multiple choice ones.
- Every test shows its questions in order from easy to hard.

A topic counts as weak when the average of your last 3 scores on it is under 70%.

## 5. Grading with Gemini, and Groq as backup

Gemini grades every answer by default. If Gemini fails or hits its limit, the app sends the same request to Groq. Both free tiers are enough for this app, as long as it makes 2 or 3 calls a day instead of one call per answer.

### What the free tier gives you now

- Google does not publish fixed free-tier numbers. Its [rate limits page](https://ai.google.dev/gemini-api/docs/rate-limits) says limits are shown in Google AI Studio, are not guaranteed, and that daily quotas reset at midnight Pacific time. That is 2 PM in Dhaka.
- One free project read its limits in AI Studio on 21 October 2026: the Flash models allowed 5 requests a minute and 20 a day; Gemini 3.5 Flash-Lite and 3.1 Flash-Lite allowed 15 a minute and 500 a day; the Pro models allowed none ([imisofts](https://imisofts.com/blog/gemini-api-free-tier-limits/)). Check your own numbers in AI Studio after you create the key.
- On the free tier, Google marks your content as used to improve its products; on the paid tier it is not ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)). Your practice answers are fine to send. Never send personal data.

### Backup: Groq

- Groq has a free tier with no credit card, limited by requests and tokens per minute and per day ([Groq](https://community.groq.com/t/is-there-a-free-tier-and-what-are-its-limits/790)). Your exact limits are on the limits page of your Groq console.
- Going over the limit returns a 429 error, never a charge ([Groq](https://community.groq.com/t/do-i-get-charged-for-anything-on-the-groq-free-plan/832)).
- Groq runs open models such as Llama. Pick the model in the Groq console and put its name in an environment variable, like the Gemini model.

### How the app uses it

| Rule | Why |
| --- | --- |
| Grade a whole test in one call, not one call per answer | A level exam becomes 1 request instead of 4. A normal day uses 2 or 3 |
| Use a Gemini Flash-Lite model by default. Keep both providers' keys and model names in environment variables: GEMINI\_API\_KEY, GEMINI\_MODEL, GROQ\_API\_KEY, GROQ\_MODEL | It has the bigger daily allowance. Model names change often, so you change one setting, not code |
| Both API keys stay on the server. One server function, gradeAnswers(), tries Gemini, then Groq, and returns the same JSON shape from either | A key in browser code can be copied by anyone who opens the page |
| Ask for JSON back and check it with Zod | So a badly formatted reply never breaks the results page |
| If Gemini returns an error (such as 429, limit reached), send the same request to Groq. If Groq also fails, save the answers as "waiting for grading" and retry later | You never lose an exam because one provider is down or out of quota |

### What Gemini returns for each answer

- A score from 0 to 10
- Which key points you covered and which you missed
- Mistakes, if any
- A short model answer, 3 to 5 sentences
- For code: edge cases you did not handle, and one suggestion

Both providers get the same prompt: the question, its stored key points, and your answer, with an instruction to grade only against the key points. The app saves which provider graded each answer. That keeps grades consistent from one day to the next.

## 6. Screens

Seven pages cover every feature in section 2.

| Page | URL | What is on it |
| --- | --- | --- |
| Dashboard | `/` | Today's task (a topic quiz or a coding problem on alternating days, or the review exam if due), current level, streak, days until the next review exam, top 5 weak topics |
| Syllabus | `/syllabus` | All levels and topics with a status each: locked, not started, studied, quiz score |
| Topic | `/topic/[id]` | Interview question, your notes box, javascript.info link, and buttons for the quiz and the coding problem |
| Test | `/test/[id]` | One page for all three kinds of test: one question at a time, timer, and the code editor for coding questions |
| Results | `/results/[id]` | Your score, each answer next to Gemini's feedback and the model answer, or "waiting for grading" |
| Mistakes | `/mistakes` | Every wrong answer, filterable by level and topic |
| History | `/history` | All past tests with date, type and score |

Your 30 minute slot alternates between two kinds of day. A review exam, when due, always comes first and replaces that day's task.

| Day | What you do |
| --- | --- |
| Quiz day | Open the next topic, answer its question out loud, write your notes, take the topic quiz |
| Coding day | Do the next coding problem with the 20 minute timer, then reread anything new in your mistakes list |

The dashboard shows which kind of day it is.

When the last topic of a level has a quiz score, the dashboard shows the level exam as today's task.

## 7. Data model

Seven tables in Supabase, which is PostgreSQL. Everything else (unlocked levels, weak topics, streak, when the next review is due) is calculated with SQL queries, not stored.

| Table | Main columns | Belongs to |
| --- | --- | --- |
| `tracks` | id, name ("JavaScript", later "React", "Node") |  |
| `levels` | id, track\_id, number, title | A track |
| `topics` | id, level\_id, position, title, interview\_question, reference\_url | A level |
| `questions` | id, topic\_id, type (mcq, output, written, coding), difficulty (easy, medium, hard), prompt, options, correct\_answer, key\_points, test\_cases, starter\_code | A topic |
| `notes` | topic\_id, body, updated\_at | A topic (one note each) |
| `tests` | id, kind (topic\_quiz, level\_exam, review), topic\_id or level\_id, started\_at, finished\_at, score, status (in\_progress, waiting\_for\_grading, graded) | A topic or a level |
| `answers` | id, test\_id, question\_id, response, is\_correct, score, feedback, graded\_by (gemini or groq) | A test and a question |

`options`, `key_points`, `test_cases` and `feedback` are JSON columns, because their shape differs by question type.

Calculated with queries:

- **Level unlocked:** the previous level has a level exam with a score of 70% or more.
- **Weak topics:** average score of the last 3 answers per topic is under 70%.
- **Review due:** the last review exam finished 3 or more days ago.
- **Streak:** the number of days in a row with at least one finished test.

## 8. Build order and stack

Build it in five versions. Each one is usable on its own, so you start studying with the app after version 1 instead of waiting for the whole thing.

| Version | What you add | You can now |
| --- | --- | --- |
| 1 | Syllabus page, topic pages, notes, topic quiz with multiple choice and output questions. Level 1 question bank loaded into the database | Study and quiz yourself every day |
| 2 | Coding problems: code editor, 20 minute timer, test cases running in a Web Worker | Do the coding ladder inside the app |
| 3 | AI grading (Gemini, then Groq) for written answers and code review, results page, retry when the limit is hit | Get feedback on explanations |
| 4 | Level exams with unlocking, the 3-day review exam, the overdue lock | Follow the full exam system |
| 5 | Dashboard, weak topics, mistakes log, history, Supabase login for your account only, deployed on Vercel | Use it from any device |

### Stack

| Part | Choice | Why |
| --- | --- | --- |
| Framework | Next.js App Router, TypeScript | One project for pages and the server code that calls Gemini |
| Database and login | Supabase | Hosted PostgreSQL plus a ready login system. Use Supabase Auth with your one account and turn off new sign-ups |
| Styling | daisyUI 5 on Tailwind CSS 4 | Ready-made components (cards, buttons, tabs, modals, progress bars), so no design work is needed |
| Code editor | CodeMirror | Only for the coding problems. See the note below |
| Validation | Zod | Checks Gemini's JSON replies and the question bank file |
| AI grading | Gemini API, with Groq as backup, called only from the server | Section 5 |
| Hosting | Vercel | Free hosting for Next.js |

No Redux and no Prisma: the app's state is small, and the Supabase client is enough to read and write data.

**Why a code editor:** the coding ladder asks you to write functions like `debounce` and `Promise.all` inside the app, and the app runs tests on them. A plain text box makes that painful: the Tab key leaves the box instead of indenting, there is no syntax colour, and brackets do not close. CodeMirror fixes those with one component. If you prefer, you can write the code in VS Code and paste it into a plain text box; then drop CodeMirror.

**Supabase free plan:** a free project is paused if it gets too little database activity over a week ([Supabase](https://supabase.com/kb/faqs/platform/free-project-pausing)). Daily use keeps it active. If you stop for more than a week, restore it from the Supabase dashboard. Keep the question bank as JSON files in the code repository, so nothing important lives only in the database.

### How it fits your roadmap

Claude Code builds the app; you only use it. So it does not replace a project in your roadmap: the Job Application Tracker stays as Project 2, built by you. Give Claude Code this spec and build one version at a time. Use each version for at least a week before asking for the next one, and drop any planned feature you found you do not need.

Before version 1, generate and review the Level 1 question bank: 7 topics, about 12 questions each.

## Sources

- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [pricing](https://ai.google.dev/gemini-api/docs/pricing), Google, read 17 November 2026
- [Gemini API free tier limits](https://imisofts.com/blog/gemini-api-free-tier-limits/), imisofts, limits read in AI Studio on 21 October 2026
- [Do Supabase projects pause when they're inactive?](https://supabase.com/kb/faqs/platform/free-project-pausing), Supabase, last edited 27 October 2026
- [Is there a free tier and what are its limits?](https://community.groq.com/t/is-there-a-free-tier-and-what-are-its-limits/790) and [Do I get charged for anything on the Groq Free Plan?](https://community.groq.com/t/do-i-get-charged-for-anything-on-the-groq-free-plan/832), Groq Community
