import { describe, expect, it } from "vitest";
import { deepEqual, format } from "./compare";
import { runTest } from "./run";

describe("deepEqual", () => {
  it("compares primitives", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, "1")).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("compares nested arrays and objects", () => {
    expect(deepEqual([1, [2, { a: 3 }]], [1, [2, { a: 3 }]])).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });
});

describe("format", () => {
  it("shows values like a test result", () => {
    expect(format([1, "a"])).toBe('[1,"a"]');
    expect(format(undefined)).toBe("undefined");
    expect(format(() => 1)).toBe("function");
    expect(format(NaN)).toBe("NaN");
  });
});

describe("runTest", () => {
  const code = "function double(n) { return n * 2; }";

  it("passes when the result matches", async () => {
    const r = await runTest(code, { name: "doubles", call: "double(2)", expected: 4 });
    expect(r).toEqual({ name: "doubles", passed: true, expected: "4", actual: "4" });
  });

  it("fails with the actual value when it does not match", async () => {
    const r = await runTest(code, { name: "wrong", call: "double(2)", expected: 5 });
    expect(r.passed).toBe(false);
    expect(r.actual).toBe("4");
  });

  it("awaits async results", async () => {
    const r = await runTest("const later = (v) => new Promise((ok) => setTimeout(() => ok(v), 5));", {
      name: "async",
      call: "later([1, 2])",
      expected: [1, 2],
    });
    expect(r.passed).toBe(true);
  });

  it("reports thrown errors and rejected promises", async () => {
    const thrown = await runTest("function f() { throw new TypeError('bad'); }", { name: "t", call: "f()", expected: 1 });
    expect(thrown).toMatchObject({ passed: false, actual: "TypeError: bad" });
    const rejected = await runTest("", { name: "r", call: "Promise.reject(new Error('no'))", expected: 1 });
    expect(rejected).toMatchObject({ passed: false, actual: "Error: no" });
  });

  it("reports a syntax error in the owner's code", async () => {
    const r = await runTest("function f( {", { name: "s", call: "f()", expected: 1 });
    expect(r.passed).toBe(false);
    expect(r.actual).toMatch(/^SyntaxError/);
  });

  it("gives each test a fresh copy of the code", async () => {
    const counter = "let count = 0; function inc() { return ++count; }";
    await runTest(counter, { name: "1", call: "inc()", expected: 1 });
    const second = await runTest(counter, { name: "2", call: "inc()", expected: 1 });
    expect(second.passed).toBe(true);
  });
});
