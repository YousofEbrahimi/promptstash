import { describe, it, expect } from "vitest";
import { diffVersions } from "../../src/diff/prompt-diff.js";
import type { Version } from "../../src/core/version.js";

function makeVersion(promptId: string, vn: number, body: string, vars: string[] = [], message = "change"): Version {
  return {
    id: `v-${vn}`,
    promptId,
    versionNumber: vn,
    body,
    variables: vars,
    message,
    createdAt: new Date().toISOString(),
  };
}

describe("prompt-diff.ts", () => {
  it("returns hasChanges=false when bodies are identical", () => {
    const v1 = makeVersion("p1", 1, "Hello world");
    const v2 = makeVersion("p1", 2, "Hello world");
    const result = diffVersions(v1, v2);
    expect(result.hasChanges).toBe(false);
    expect(result.addedLines).toBe(0);
    expect(result.removedLines).toBe(0);
  });

  it("detects added lines", () => {
    const v1 = makeVersion("p1", 1, "Line 1");
    const v2 = makeVersion("p1", 2, "Line 1\nLine 2\nLine 3");
    const result = diffVersions(v1, v2);
    expect(result.hasChanges).toBe(true);
    expect(result.addedLines).toBeGreaterThanOrEqual(2);
    expect(result.removedLines).toBeLessThanOrEqual(1);
  });

  it("detects removed lines", () => {
    const v1 = makeVersion("p1", 1, "A\nB\nC");
    const v2 = makeVersion("p1", 2, "A");
    const result = diffVersions(v1, v2);
    expect(result.hasChanges).toBe(true);
    expect(result.removedLines).toBeGreaterThanOrEqual(2);
    expect(result.addedLines).toBeLessThanOrEqual(1);
  });

  it("detects added variables", () => {
    const v1 = makeVersion("p1", 1, "Hello {{name}}", ["name"]);
    const v2 = makeVersion("p1", 2, "Hello {{name}}, your role is {{role}}", ["name", "role"]);
    const result = diffVersions(v1, v2);
    expect(result.addedVariables).toEqual(["role"]);
    expect(result.removedVariables).toEqual([]);
    expect(result.hasChanges).toBe(true);
  });

  it("detects removed variables", () => {
    const v1 = makeVersion("p1", 1, "Hello {{a}} and {{b}}", ["a", "b"]);
    const v2 = makeVersion("p1", 2, "Hello {{a}}", ["a"]);
    const result = diffVersions(v1, v2);
    expect(result.removedVariables).toEqual(["b"]);
    expect(result.hasChanges).toBe(true);
  });

  it("produces a unified diff string", () => {
    const v1 = makeVersion("p1", 1, "Old content");
    const v2 = makeVersion("p1", 2, "New content");
    const result = diffVersions(v1, v2);
    expect(result.unified).toContain("v1");
    expect(result.unified).toContain("v2");
    expect(result.unified).toContain("Old content");
    expect(result.unified).toContain("New content");
  });

  it("handles empty to content", () => {
    const v1 = makeVersion("p1", 1, "");
    const v2 = makeVersion("p1", 2, "Fresh start");
    const result = diffVersions(v1, v2);
    expect(result.hasChanges).toBe(true);
    expect(result.addedLines).toBe(1);
  });
});