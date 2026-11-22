# JavaScript Interview Syllabus

Nov 17, 2026 · @Toki Osman Nahian

This syllabus covers the JavaScript topics most often asked in frontend and full-stack interviews, in 6 levels from easy to hard, plus a ladder of 12 functions to write from scratch and 12 DSA problems. Do it in order: each level uses the one before it.

Trimmed on Nov 23, 2026 to what frontend interview guides ask most: the [Front End Interview Handbook](https://www.frontendinterviewhandbook.com/) (JavaScript, coding and algorithms chapters) and the [BFE.dev](https://bigfrontend.dev/problem) problem list. Topics that are rarely asked, repeat another topic, or are mostly history were removed.

## How to use it

Use your 30 minute interview slot. It alternates between two kinds of day, and your interview app runs this for you.

| Day        | What you do                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quiz day   | Study the next topic: answer its interview question out loud in English without notes and record it, check what you missed, then take its 15-question quiz |
| Coding day | Write the next function from the coding ladder, then the next DSA problem, in 20 minutes, without AI. Then reread your mistakes                             |

That is 3 quiz days and 3 coding days a week. The 37 topics take about 12 to 13 weeks. The 12 ladder functions take about 4 weeks of coding days and the 12 DSA problems about 4 more; use the remaining coding days to redo the problems you could not finish.

The app opens the next topic when you score 50% or more on the current topic's quiz, and the next coding problem when a submit passes at least 50% of its tests.

How to read the tables:

- **How often asked:** Very common means almost every JavaScript round; Common means many rounds. This is an estimate from typical interview loops and the guides above, not a measured number.
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

## Level 2: Functions (5 topics, weeks 3 to 5)

Closures and `this` are the two topics interviewers use most to separate people who memorised answers from people who understand JavaScript. The classic `var` loop with `setTimeout` is part of the closures topic; currying is practised in the coding ladder.

| #   | Topic                                                   | Interview question                                                     | Real use                                           | How often asked |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- | --------------- |
| 9   | Function declarations vs expressions vs arrow functions | What are the differences, including hoisting and `this`?               | Choosing how to write components and handlers      | Very common     |
| 10  | Closures                                                | What is a closure? Give a real example from your code                  | Custom hooks, debounce, stale state in `useEffect` | Very common     |
| 11  | `this`                                                  | What decides the value of `this`? What is it inside an arrow function? | Class components, object methods, event handlers   | Very common     |
| 12  | `call`, `apply`, `bind`                                 | What does each do? When would you use `bind`?                          | Passing methods as callbacks without losing `this` | Common          |
| 13  | Higher-order functions                                  | What is a higher-order function? Give examples from arrays             | `map`, `filter`, `reduce`; Express middleware      | Common          |

## Level 3: Objects, prototypes and classes (6 topics, weeks 5 to 7)

This level explains how JavaScript objects really work. The copying topics matter most for you, because immutable updates are the core of React state and Redux.

| #   | Topic                                           | Interview question                                                                                   | Real use                                                                                           | How often asked |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------- |
| 14  | Reference vs value                              | Why does changing a copied object also change the original?                                          | Why mutating state does not re-render in React                                                     | Very common     |
| 15  | Shallow copy vs deep copy                       | What is the difference? How do spread, `Object.assign` and `structuredClone` differ?                 | Updating nested state in reducers                                                                  | Very common     |
| 16  | Array methods that mutate vs return a new array | Which array methods change the original array? What is the difference between `sort` and `toSorted`? | Sorting or reversing state in React without mutating it, using `toSorted`, `toReversed` and `with` | Common          |
| 17  | Destructuring, spread and rest                  | How do they work for objects, arrays and function arguments?                                         | Props, hooks, reducer updates                                                                      | Very common     |
| 18  | Prototypes and the prototype chain              | What is a prototype? How does property lookup work?                                                  | Understanding how array methods and classes work                                                   | Common          |
| 19  | Classes and `new`                               | What does `new` do step by step? Are classes just prototypes underneath?                             | Error classes, services in Node                                                                    | Common          |

## Level 4: Async JavaScript (7 topics, weeks 7 to 9)

This is the most important level. Almost every frontend and Node interview asks about the event loop and promises, and many coding rounds ask you to write a promise helper. The event loop topic also covers why JavaScript is single-threaded but non-blocking.

| #   | Topic                                      | Interview question                                                                                                                                    | Real use                                                                              | How often asked |
| --- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------- |
| 20  | The event loop                             | Explain the call stack, task queue and event loop step by step                                                                                        | Knowing why a `setTimeout(fn, 0)` runs after other code                               | Very common     |
| 21  | Microtasks vs macrotasks                   | Why does a resolved promise run before `setTimeout(fn, 0)`?                                                                                           | Predicting the order of async updates                                                 | Very common     |
| 22  | Promises                                   | What are the three states? How does chaining with `.then` work?                                                                                       | Every `fetch` call                                                                    | Very common     |
| 23  | `async` and `await`                        | How does `await` work? How do you handle errors with it?                                                                                              | Data fetching, server actions, Express handlers                                       | Very common     |
| 24  | Error handling in async code               | How do you catch errors with `await`? Why does `fetch` not throw on a 404? What is an unhandled rejection, and how do you write a custom error class? | `try/catch` around `fetch`, checking `response.ok`, a custom `ApiError` class in Node | Very common     |
| 25  | `Promise.all`, `allSettled`, `race`, `any` | What is the difference? When does each one reject?                                                                                                    | Loading several API calls in parallel                                                 | Very common     |
| 26  | Cancelling requests                        | How do you cancel a `fetch`? What is a race condition in search?                                                                                      | `AbortController` in a debounced search                                               | Common          |

## Level 5: Browser (6 topics, weeks 10 to 11)

Frontend interviews often move from the language to the browser here. React hides much of this, which is exactly why interviewers check that you still know it.

| #   | Topic                                        | Interview question                                                                                         | Real use                                                         | How often asked |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| 27  | Event bubbling and capturing                 | What are the two phases? What do `stopPropagation` and `preventDefault` do?                                | A click inside a modal that also closes it by mistake            | Very common     |
| 28  | Event delegation                             | What is it, and why is it efficient?                                                                       | One listener for a long list; how React attaches events          | Very common     |
| 29  | `localStorage`, `sessionStorage` and cookies | What are the differences in size, lifetime and who can read them?                                          | Saving the theme; storing a session cookie                       | Very common     |
| 30  | CORS and the same-origin policy              | What is the same-origin policy? How does CORS let a page call an API on another origin, and what is a preflight request? | Calling your Express or Next.js API from the frontend; fixing CORS errors | Very common     |
| 31  | How the browser renders a page               | What happens from typing a URL to seeing the page? What are reflow and repaint?                            | Explaining why some animations are slow                          | Common          |
| 32  | Script loading                               | What is the difference between `async` and `defer`?                                                        | Loading third-party scripts in Next.js                           | Common          |

## Level 6: Advanced topics (5 topics, weeks 12 to 13)

These come up in deeper rounds and in follow-up questions. You do not need every detail, but you should explain each one clearly with an example.

| #   | Topic                               | Interview question                                                     | Real use                                                       | How often asked |
| --- | ----------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- | --------------- |
| 33  | Debounce vs throttle                | What is the difference? When would you use each?                       | Search input (debounce); scroll and resize handlers (throttle) | Very common     |
| 34  | `Map`, `Set`, `WeakMap`             | When is a `Map` better than an object? What makes `WeakMap` different? | Removing duplicates; caches keyed by object                    | Common          |
| 35  | ES modules vs CommonJS              | What is the difference between `import` and `require`?                 | Node projects; why some packages fail to import                | Common          |
| 36  | Memory leaks and garbage collection | How does garbage collection work? Name common causes of memory leaks   | Forgetting to clean up listeners and timers in `useEffect`     | Common          |
| 37  | Immutability and pure functions     | What is a pure function? Why do Redux reducers have to be pure?        | Reducers, selectors, easy-to-test logic                        | Common          |

Every topic has three "what does this print?" questions in its quiz, so output prediction is practised all the way through instead of in a separate level. When you finish Level 6, ask AI for 10 new snippets on Levels 1 to 4, and answer them before reading the answers.

## Coding ladder: 12 functions to write from scratch

These are the "implement X" questions of JavaScript coding rounds, the ones the Front End Interview Handbook and BFE.dev list most. Do them in order, one per coding day, in your 20 minute slot. Each one practises a topic from the levels above.

Rules for every function: no AI, no looking it up, a 20 minute timer. Then test it with at least three cases, including an empty input and one odd case. If you could not finish, read a solution and write it again from memory the next day.

### Easy (weeks 1 to 2)

- [ ] 1\. Write your own `map`
- [ ] 2\. Write your own `reduce`
- [ ] 3\. `groupBy(items, key)`: group an array of objects by a property
- [ ] 4\. `flatten(array)`: one level first, then any depth
- [ ] 5\. `memoize(fn)`: cache results for the same argument

### Medium (weeks 2 to 4)

- [ ] 6\. `debounce(fn, delay)`
- [ ] 7\. `throttle(fn, delay)`
- [ ] 8\. `curry(fn)`
- [ ] 9\. Write your own `bind`
- [ ] 10\. `deepClone(value)` for objects and arrays
- [ ] 11\. Write your own `Promise.all`
- [ ] 12\. An event emitter with `on`, `off`, `emit` and `once`

If you finish early, good next steps from interview lists are: running async tasks with a concurrency limit, and a simple `Promise` class with `then` and `catch`.

## Coding ladder part 2: 12 DSA problems for frontend

Frontend interviews focus on JavaScript utility functions and UI building more than algorithm puzzles, and the Front End Interview Handbook says companies "tend to go easy" on frontend candidates. So this list is short, easy and medium only, and leans on trees, because the DOM is a tree. Start it after the ladder above (weeks 5 to 9), with the same rules: no AI, a 20 minute timer, at least three test cases.

| #   | LeetCode problem                                                                                                                   | Pattern                | Where frontend uses it                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| 13  | [1. Two Sum](https://leetcode.com/problems/two-sum/)                                                                               | Hash map               | Fast lookups by id instead of nested loops     |
| 14  | [242. Valid Anagram](https://leetcode.com/problems/valid-anagram/)                                                                 | Counting with a map    | Comparing and grouping data                    |
| 15  | [49. Group Anagrams](https://leetcode.com/problems/group-anagrams/)                                                                | Hash map grouping      | Grouping list items for a UI                   |
| 16  | [20. Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)                                                          | Stack                  | Matching HTML or JSX tags, brackets in editors |
| 17  | [3. Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Sliding window         | Text input handling, windowed lists            |
| 18  | [704. Binary Search](https://leetcode.com/problems/binary-search/)                                                                 | Binary search          | Finding the visible row in a virtualized list  |
| 19  | [56. Merge Intervals](https://leetcode.com/problems/merge-intervals/)                                                              | Sort and merge         | Calendar events, overlapping time slots        |
| 20  | [146. LRU Cache](https://leetcode.com/problems/lru-cache/)                                                                         | Hash map in order      | Caching API responses or recently viewed items |
| 21  | [104. Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)                                   | Tree DFS               | Nesting depth of a DOM tree                    |
| 22  | [100. Same Tree](https://leetcode.com/problems/same-tree/)                                                                         | Tree comparison        | The idea behind virtual DOM diffing            |
| 23  | [102. Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)                         | Tree BFS               | Walking the DOM level by level                 |
| 24  | [236. Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)             | Tree recursion         | Closest shared parent of two DOM nodes         |
