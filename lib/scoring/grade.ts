// Pure grading functions. Every question scores between 0 and 1.

// An honest "I don't know" answer. It never matches, so it scores 0.
export const DONT_KNOW = "I don't know";

export function normalizeOutput(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function gradeMcq(response: string | null, correct: string): number {
  return response === correct ? 1 : 0;
}

export function gradeOutput(response: string | null, correct: string): number {
  if (response === null) return 0;
  return normalizeOutput(response) === normalizeOutput(correct) ? 1 : 0;
}

// Average of question scores as a whole percentage. Zero questions scores 0.
export function testScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100);
}
