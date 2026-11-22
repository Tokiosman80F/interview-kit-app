# JavaScript Interview Syllabus

Nov 17, 2026 · @Toki Osman Nahian

This syllabus covers the JavaScript topics most often asked in frontend and full-stack interviews, in 7 levels from easy to hard, plus a ladder of 30 functions to write from scratch. Do it in order: each level uses the one before it.

## How to use it

Use your 30 minute interview slot. It alternates between two kinds of day, and your interview app will run this for you once it is built.

| Day        | What you do                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quiz day   | Study the next topic: answer its interview question out loud in English without notes and record it, check what you missed, then take its 15-question quiz |
| Coding day | Write the next function from the coding ladder at the end, in 20 minutes (35 for the hard ones), without AI. Then reread your mistakes                     |

That is 3 quiz days and 3 coding days a week. The 49 topics take about 16 to 17 weeks, slightly longer than your 16-week roadmap. To finish on time, do two quiz days in a row whenever you are ahead.

How to read the tables:

- **How often asked:** Very common means almost every JavaScript round; Common means many rounds; Sometimes means mostly in deeper or senior rounds. This is my estimate from typical interview loops, not a measured number.
- **Real use:** where the idea shows up in your own React or Node code, so you can answer "where have you used this?", which interviewers often ask next.

Read the matching chapter on [javascript.info](https://javascript.info/) when a topic is new to you.

## Level 1: Foundations (8 topics, weeks 1 to 3)

These are the warm-up questions of almost every interview. Getting one wrong early makes the interviewer doubt everything after it.

| #   | Topic                                | Interview question                                                                                                  | Real use                                                                                        | How often asked |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| 1   | Data types                           | What are the primitive types? How is a primitive different from an object?                                          | Knowing why changing an object inside a function changes it outside                             | Very common     |
| 2   | `var`, `let`, `const`                | What are the differences? Can you change a `const` object?                                                          | Using `let` in loops; `const` for state setters and imports                                     | Very common     |
| 3   | Hoisting and the temporal dead zone  | What is hoisted, and why does using a `let` before its line throw?                                                  | Understanding "cannot access before initialization" errors                                      | Very common     |
| 4   | Scope                                | What are global, function and block scope? What is the scope chain?                                                 | Variables inside `useEffect` and event handlers                                                 | Very common     |
| 5   | `==` vs `===` and type coercion      | Why is `"5" + 1` equal to `"51"` but `"5" - 1` equal to `4`?                                                        | Comparing form input values, which are always strings                                           | Very common     |
| 6   | Truthy and falsy                     | Name all falsy values. Why can `{count && <p/>}` render a `0`?                                                      | Conditional rendering bugs in React                                                             | Common          |
| 7   | `typeof`, `null` and `undefined`     | Why is `typeof null` equal to `"object"`? When do you get `null` vs `undefined`?                                    | Checking API responses and optional props                                                       | Common          |
| 8   | `??` vs `\|\|` and optional chaining | What does `count \|\| 10` return when `count` is `0`, and how does `??` fix it? What does `user?.address?.city` do? | Default values for props and API fields that can be `0` or `""`; reading nested API data safely | Very common     |

## Level 2: Functions (7 topics, weeks 3 to 5)

Closures and `this` are the two topics interviewers use most to separate people who memorised answers from people who understand JavaScript.

| #   | Topic                                                   | Interview question                                                                | Real use                                           | How often asked |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- | --------------- |
| 9   | Function declarations vs expressions vs arrow functions | What are the differences, including hoisting and `this`?                          | Choosing how to write components and handlers      | Very common     |
| 10  | Closures                                                | What is a closure? Give a real example from your code                             | Custom hooks, debounce, stale state in `useEffect` | Very common     |
| 11  | Closures in loops                                       | Why does a `var` loop with `setTimeout` print the same number? How do you fix it? | Timers and async callbacks inside loops            | Very common     |
| 12  | `this`                                                  | What decides the value of `this`? What is it inside an arrow function?            | Class components, object methods, event handlers   | Very common     |
| 13  | `call`, `apply`, `bind`                                 | What does each do? When would you use `bind`?                                     | Passing methods as callbacks without losing `this` | Common          |
| 14  | Higher-order functions                                  | What is a higher-order function? Give examples from arrays                        | `map`, `filter`, `reduce`; Express middleware      | Common          |
| 15  | Currying and partial application                        | What is currying, and why is it useful?                                           | Reusable handlers like `handleChange("email")`     | Common          |

## Level 3: Objects, prototypes and classes (8 topics, weeks 6 to 8)

This level explains how JavaScript objects really work. The copying topics matter most for you, because immutable updates are the core of React state and Redux.

| #   | Topic                                           | Interview question                                                                                   | Real use                                                                                           | How often asked |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------- |
| 16  | Reference vs value                              | Why does changing a copied object also change the original?                                          | Why mutating state does not re-render in React                                                     | Very common     |
| 17  | Shallow copy vs deep copy                       | What is the difference? How do spread, `Object.assign` and `structuredClone` differ?                 | Updating nested state in reducers                                                                  | Very common     |
| 18  | Array methods that mutate vs return a new array | Which array methods change the original array? What is the difference between `sort` and `toSorted`? | Sorting or reversing state in React without mutating it, using `toSorted`, `toReversed` and `with` | Common          |
| 19  | Destructuring, spread and rest                  | How do they work for objects, arrays and function arguments?                                         | Props, hooks, reducer updates                                                                      | Very common     |
| 20  | Prototypes and the prototype chain              | What is a prototype? How does property lookup work?                                                  | Understanding how array methods and classes work                                                   | Common          |
| 21  | Classes and `new`                               | What does `new` do step by step? Are classes just prototypes underneath?                             | Error classes, services in Node                                                                    | Common          |
| 22  | Object methods                                  | What do `Object.keys`, `entries`, `freeze` and `fromEntries` do? Is `freeze` deep?                   | Turning API data into lists; config objects                                                        | Common          |
| 23  | Getters, setters and property descriptors       | What is a getter? What does `Object.defineProperty` control?                                         | Computed values in classes; how some libraries track changes                                       | Sometimes       |

## Level 4: Async JavaScript (9 topics, weeks 8 to 11)

This is the most important level. Almost every frontend and Node interview asks about the event loop and promises, and many coding rounds ask you to write a promise helper.

| #   | Topic                                      | Interview question                                                                                                                                    | Real use                                                                              | How often asked |
| --- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------- |
| 24  | Synchronous vs asynchronous code           | Why is JavaScript single-threaded but still non-blocking?                                                                                             | Fetching data without freezing the page                                               | Very common     |
| 25  | The event loop                             | Explain the call stack, task queue and event loop step by step                                                                                        | Knowing why a `setTimeout(fn, 0)` runs after other code                               | Very common     |
| 26  | Microtasks vs macrotasks                   | Why does a resolved promise run before `setTimeout(fn, 0)`?                                                                                           | Predicting the order of async updates                                                 | Very common     |
| 27  | Callbacks and callback hell                | What problems do nested callbacks cause?                                                                                                              | Old Node APIs; why promises were added                                                | Common          |
| 28  | Promises                                   | What are the three states? How does chaining with `.then` work?                                                                                       | Every `fetch` call                                                                    | Very common     |
| 29  | `async` and `await`                        | How does `await` work? How do you handle errors with it?                                                                                              | Data fetching, server actions, Express handlers                                       | Very common     |
| 30  | Error handling in async code               | How do you catch errors with `await`? Why does `fetch` not throw on a 404? What is an unhandled rejection, and how do you write a custom error class? | `try/catch` around `fetch`, checking `response.ok`, a custom `ApiError` class in Node | Very common     |
| 31  | `Promise.all`, `allSettled`, `race`, `any` | What is the difference? When does each one reject?                                                                                                    | Loading several API calls in parallel                                                 | Very common     |
| 32  | Cancelling requests                        | How do you cancel a `fetch`? What is a race condition in search?                                                                                      | `AbortController` in a debounced search                                               | Common          |

## Level 5: Browser and DOM (6 topics, weeks 11 to 13)

Frontend interviews often move from the language to the browser here. React hides much of this, which is exactly why interviewers check that you still know it.

| #   | Topic                                        | Interview question                                                              | Real use                                                | How often asked |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------- |
| 33  | Event bubbling and capturing                 | What are the two phases? What do `stopPropagation` and `preventDefault` do?     | A click inside a modal that also closes it by mistake   | Very common     |
| 34  | Event delegation                             | What is it, and why is it efficient?                                            | One listener for a long list; how React attaches events | Very common     |
| 35  | `localStorage`, `sessionStorage` and cookies | What are the differences in size, lifetime and who can read them?               | Saving the theme; storing a session cookie              | Very common     |
| 36  | How the browser renders a page               | What happens from typing a URL to seeing the page? What are reflow and repaint? | Explaining why some animations are slow                 | Common          |
| 37  | Script loading                               | What is the difference between `async` and `defer`?                             | Loading third-party scripts in Next.js                  | Common          |
| 38  | DOM APIs                                     | How do you select, create and update elements without a framework?              | Small scripts; understanding what React does for you    | Sometimes       |

## Level 6: Advanced topics (6 topics, weeks 13 to 15)

These come up in deeper rounds and in follow-up questions. You do not need every detail, but you should explain each one clearly with an example.

| #   | Topic                               | Interview question                                                     | Real use                                                       | How often asked |
| --- | ----------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- | --------------- |
| 39  | Debounce vs throttle                | What is the difference? When would you use each?                       | Search input (debounce); scroll and resize handlers (throttle) | Very common     |
| 40  | `Map`, `Set`, `WeakMap`             | When is a `Map` better than an object? What makes `WeakMap` different? | Removing duplicates; caches keyed by object                    | Common          |
| 41  | ES modules vs CommonJS              | What is the difference between `import` and `require`?                 | Node projects; why some packages fail to import                | Common          |
| 42  | Memory leaks and garbage collection | How does garbage collection work? Name common causes of memory leaks   | Forgetting to clean up listeners and timers in `useEffect`     | Common          |
| 43  | Iterators and generators            | What is an iterator? What does `yield` do?                             | Paginating through API results; how `for...of` works           | Sometimes       |
| 44  | Immutability and pure functions     | What is a pure function? Why do Redux reducers have to be pure?        | Reducers, selectors, easy-to-test logic                        | Common          |

## Level 7: Output prediction (5 topics, weeks 15 to 17)

Interviewers show a short snippet and ask what it prints. These questions test Levels 1 to 4 together. Cover the Answer column, say your answer out loud, then check.

| #   | Topic                | What does this print?                                                                                             | Answer                                                                                      | Why                                                                                                                                             |
| --- | -------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 45  | Hoisting             | `console.log(a); var a = 1;` and the same with `let`                                                              | `undefined` with `var`; a `ReferenceError` with `let`                                       | `var` is hoisted and set to `undefined`; `let` is in the temporal dead zone until its line                                                      |
| 46  | Closures in loops    | `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));`                                                   | `3 3 3`, and `0 1 2` if you change `var` to `let`                                           | `var` shares one `i`; `let` creates a new `i` for each loop                                                                                     |
| 47  | Event loop order     | `console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);` | `1 4 3 2`                                                                                   | Normal code runs first, then microtasks (promises), then macrotasks (timers)                                                                    |
| 48  | Losing `this`        | `const greet = user.greet; greet();` where `greet` returns `this.name`                                            | A `TypeError` in strict mode and ES modules; in old non-strict scripts, not the user's name | The function is called without an object, so `this` is `undefined` in strict mode (reading `.name` on it throws) or the global object otherwise |
| 49  | Coercion and numbers | `[] + []`, `[] + {}`, `0.1 + 0.2 === 0.3`                                                                         | `""`, `"[object Object]"`, `false`                                                          | `+` turns objects into strings; decimal numbers are stored with small rounding errors                                                           |

When you finish this level, ask AI for 10 new snippets on Levels 1 to 4, and answer them before reading the answers.

## Coding ladder: 30 functions to write from scratch

These are the "implement X" questions of JavaScript coding rounds. Do them in order, one per coding day: 20 minutes each for easy and medium, 35 minutes for hard. Whenever you are ahead of the weeks below, use the spare coding day to redo a function you could not finish. Each one practises a topic from the levels above.

Rules for every function: no AI, no looking it up, a timer (20 minutes, or 35 for numbers 24 to 30). Then test it with at least three cases, including an empty input and one odd case. If you could not finish, read a solution and write it again from memory the next day.

### Easy (weeks 1 to 5)

- [ ] 1\. Write your own `map`
- [ ] 2\. Write your own `filter`
- [ ] 3\. Write your own `reduce`
- [ ] 4\. `groupBy(items, key)`: group an array of objects by a property
- [ ] 5\. `unique(array)`: remove duplicates, once with a `Set` and once without
- [ ] 6\. `chunk(array, size)`: split an array into groups
- [ ] 7\. `flatten(array)`: one level first, then any depth
- [ ] 8\. `countBy(array)`: count how many times each value appears
- [ ] 9\. `once(fn)`: a function that runs only the first time
- [ ] 10\. `memoize(fn)`: cache results for the same argument

### Medium (weeks 6 to 12)

- [ ] 11\. `debounce(fn, delay)`
- [ ] 12\. `throttle(fn, delay)`
- [ ] 13\. `curry(fn)`
- [ ] 14\. Write your own `bind`
- [ ] 15\. `deepClone(value)` for objects and arrays
- [ ] 16\. `deepEqual(a, b)`
- [ ] 17\. `compose` and `pipe`
- [ ] 18\. Write your own `Promise.all`
- [ ] 19\. Write your own `Promise.allSettled`
- [ ] 20\. Write your own `Promise.race` and `Promise.any`
- [ ] 21\. `retry(fn, times, delay)`: retry a failing async function
- [ ] 22\. An event emitter with `on`, `off`, `emit` and `once`
- [ ] 23\. `get(object, "a.b.c")`: read a nested value safely

### Hard (weeks 13 to 16, 35 minutes each)

Real interview rounds give 30 to 45 minutes for problems like these. With testing, they need more than your 30 minute slot, so book 40 minutes on hard coding days.

- [ ] 24\. Run async tasks with a concurrency limit, for example at most 3 at a time
- [ ] 25\. `debounce` with `leading`, `trailing` and `cancel` options
- [ ] 26\. An LRU cache using `Map`
- [ ] 27\. A simple `Promise` class with `then` and `catch`
- [ ] 28\. `deepClone` that handles circular references
- [ ] 29\. `flattenObject`: turn `{ a: { b: 1 } }` into `{ "a.b": 1 }`
- [ ] 30\. A small `createStore` like Redux, with `getState`, `dispatch` and `subscribe`

Number 30 connects to your Redux course: if you want, write it earlier, right after you finish that course in weeks 4 and 5 of your roadmap.

## Coding ladder part 2: 15 DSA problems for frontend

Frontend interviews focus on JavaScript utility functions and UI building more than algorithm puzzles, so this list is short, easy and medium only, and each problem is tied to something frontend developers do. Start it after number 30 (weeks 17 to 21), with the same rules: no AI, a 20 minute timer, at least three test cases. LRU cache and flatten are left out because the ladder above already has them.

| #   | LeetCode problem                                                                                                                   | Pattern                 | Where frontend uses it                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| 31  | [1. Two Sum](https://leetcode.com/problems/two-sum/)                                                                               | Hash map                | Fast lookups by id instead of nested loops     |
| 32  | [242. Valid Anagram](https://leetcode.com/problems/valid-anagram/)                                                                 | Counting with a map     | Comparing and grouping data                    |
| 33  | [49. Group Anagrams](https://leetcode.com/problems/group-anagrams/)                                                                | Hash map grouping       | Grouping list items for a UI                   |
| 34  | [20. Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)                                                          | Stack                   | Matching HTML or JSX tags, brackets in editors |
| 35  | [155. Min Stack](https://leetcode.com/problems/min-stack/)                                                                         | Stack                   | Undo and redo history                          |
| 36  | [3. Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Sliding window          | Text input handling, windowed lists            |
| 37  | [704. Binary Search](https://leetcode.com/problems/binary-search/)                                                                 | Binary search           | Finding the visible row in a virtualized list  |
| 38  | [56. Merge Intervals](https://leetcode.com/problems/merge-intervals/)                                                              | Sort and merge          | Calendar events, overlapping time slots        |
| 39  | [347. Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)                                             | Counting and sorting    | "Most used" tags, search suggestions           |
| 40  | [104. Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)                                   | Tree DFS                | Nesting depth of a DOM tree                    |
| 41  | [102. Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)                         | Tree BFS                | Walking the DOM level by level                 |
| 42  | [100. Same Tree](https://leetcode.com/problems/same-tree/)                                                                         | Tree comparison         | The idea behind virtual DOM diffing            |
| 43  | [236. Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)             | Tree recursion          | Closest shared parent of two DOM nodes         |
| 44  | [208. Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/)                                                   | Trie                    | Autocomplete in a search box                   |
| 45  | [207. Course Schedule](https://leetcode.com/problems/course-schedule/)                                                             | Graph, topological sort | Dependency order in bundlers and task runners  |
