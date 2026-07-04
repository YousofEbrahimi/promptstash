import { describe, it, expect } from "vitest";
import { generateId } from "../../src/core/version.js";

describe("version.ts", () => {
  it("generateId returns unique strings", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) ids.add(generateId());
    expect(ids.size).toBe(100);
  });

  it("generateId returns non-empty strings", () => {
    for (let i = 0; i < 10; i++) {
      expect(generateId().length).toBeGreaterThan(0);
    }
  });

  it("generateId format is predictable-ish (base36)", () => {
    const id = generateId();
    // base36 chars only
    expect(/^[a-z0-9]+$/.test(id)).toBe(true);
  });
});