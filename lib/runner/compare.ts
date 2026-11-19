// Pure helpers for checking a test result. Expected values come from JSON,
// so plain values, arrays and objects are all that need comparing.

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b || (Number.isNaN(a) && Number.isNaN(b))) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  if (keys.length !== Object.keys(y).length) return false;
  return keys.every((k) => Object.hasOwn(y, k) && deepEqual(x[k], y[k]));
}

// Shows a value the way a test result should print it.
export function format(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "function") return "function";
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
