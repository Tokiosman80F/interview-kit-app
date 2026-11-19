import { deepEqual, format } from "./compare.ts";

export type TestCase = { name: string; call: string; expected: unknown };
export type TestResult = { name: string; passed: boolean; expected: string; actual: string };

// Runs one test: the owner's code is evaluated fresh, then `call` is evaluated
// next to it, so each test sees its own copy of the function. Async calls are
// awaited, and anything thrown, including a syntax error, is a failed test.
export async function runTest(code: string, test: TestCase): Promise<TestResult> {
  const expected = format(test.expected);
  try {
    const value = await new Function(`${code}\n;return (${test.call});`)();
    return { name: test.name, passed: deepEqual(value, test.expected), expected, actual: format(value) };
  } catch (e) {
    const actual = e instanceof Error ? `${e.name}: ${e.message}` : `Threw ${format(e)}`;
    return { name: test.name, passed: false, expected, actual };
  }
}
