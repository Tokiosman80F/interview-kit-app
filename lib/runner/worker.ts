// Runs in a Web Worker, so an infinite loop never freezes the page.
// Each result is posted as soon as it is ready; the page kills the worker
// after 3 seconds and marks whatever has not finished as a timeout.
import { runTest, type TestCase } from "./run.ts";

self.onmessage = async (event: MessageEvent<{ code: string; tests: TestCase[] }>) => {
  const { code, tests } = event.data;
  for (let index = 0; index < tests.length; index++) {
    self.postMessage({ index, result: await runTest(code, tests[index]) });
  }
  self.postMessage({ done: true });
};
