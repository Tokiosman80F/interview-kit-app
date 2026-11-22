// Builds the question list of a topic quiz.

const rank = { easy: 0, medium: 1, hard: 2 } as const;
type Difficulty = keyof typeof rank;

// Stable sort: easy, then medium, then hard; input order kept within a difficulty.
export function easyToHard<T extends { difficulty: Difficulty }>(questions: T[]): T[] {
  return [...questions].sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
}

// All 15 quiz questions of a topic: multiple choice, output and written.
// Coding problems are practised on the coding ladder, not in topic quizzes.
export function buildTopicQuiz<T extends { type: string; difficulty: Difficulty }>(questions: T[]): T[] {
  return easyToHard(questions.filter((q) => q.type !== "coding"));
}
