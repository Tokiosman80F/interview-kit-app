// Unlock rule for topics and for the coding ladder: the first item is always
// open, and each next item opens only when the one before it has a best score
// of at least PASS_MARK percent. The first locked item locks everything after it.

export const PASS_MARK = 50;

export function unlockedIds(orderedIds: string[], best: Map<string, number>, passMark = PASS_MARK): Set<string> {
  const open = new Set<string>();
  for (let i = 0; i < orderedIds.length; i++) {
    if (i > 0 && (best.get(orderedIds[i - 1]) ?? -1) < passMark) break;
    open.add(orderedIds[i]);
  }
  return open;
}

// Best score (0 to 100) per id from a list of attempts.
export function bestScores(attempts: { id: string; score: number }[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const a of attempts) best.set(a.id, Math.max(best.get(a.id) ?? -1, a.score));
  return best;
}
