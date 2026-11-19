import type { TestCase, TestResult } from "./run.ts";

export const TIME_LIMIT_MS = 3000;

// Runs every test in a fresh worker. Returns one result per test; tests that
// had not finished when the time limit hit are marked as a timeout.
export function runInWorker(
  code: string,
  tests: TestCase[],
  onResult: (index: number, result: TestResult) => void,
): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const results: (TestResult | null)[] = tests.map(() => null);
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

    const finish = (reason: string) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(
        results.map(
          (r, i) => r ?? { name: tests[i].name, passed: false, expected: "", actual: reason },
        ),
      );
    };
    const timer = setTimeout(() => finish("Timed out after 3 seconds"), TIME_LIMIT_MS);

    worker.onmessage = (event: MessageEvent<{ done?: true; index: number; result: TestResult }>) => {
      if (event.data.done) return finish("Did not run");
      const { index, result } = event.data;
      results[index] = result;
      onResult(index, result);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(`Error: ${event.message}`);
    };
    worker.postMessage({ code, tests });
  });
}
