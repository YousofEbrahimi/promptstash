import { describe, it, expect } from "vitest";
import {
  validatePromptName,
  extractVariables,
  renderBody,
} from "../../src/core/prompt.js";

describe("prompt.ts", () => {
  describe("validatePromptName", () => {
    it("accepts valid names", () => {
      expect(validatePromptName("code-reviewer")).toBe(true);
      expect(validatePromptName("my-prompt-v2")).toBe(true);
      expect(validatePromptName("a")).toBe(true);
      expect(validatePromptName("abc123")).toBe(true);
    });

    it("rejects invalid names", () => {
      expect(validatePromptName("CodeReviewer")).toBe(false);
      expect(validatePromptName("code_reviewer")).toBe(false);
      expect(validatePromptName("code reviewer")).toBe(false);
      expect(validatePromptName("1-prompt")).toBe(false);
      expect(validatePromptName("")).toBe(false);
      expect(validatePromptName("my--prompt")).toBe(true); // double hyphen allowed
    });
  });

  describe("extractVariables", () => {
    it("extracts basic variables", () => {
      expect(extractVariables("Review this {{language}} code")).toEqual(["language"]);
      expect(extractVariables("Write a {{style}} {{length}} response")).toEqual(["style", "length"]);
    });

    it("handles whitespace variations", () => {
      expect(extractVariables("Hello {{ name }}")).toEqual(["name"]);
      expect(extractVariables("{{  language  }}")).toEqual(["language"]);
    });

    it("deduplicates variables", () => {
      expect(extractVariables("{{a}} and {{a}} again")).toEqual(["a"]);
    });

    it("returns empty for no variables", () => {
      expect(extractVariables("No variables here")).toEqual([]);
      expect(extractVariables("{{}} also none")).toEqual([]);
    });

    it("handles complex prompt bodies", () => {
      const body = `You are a {{role}}.
Review this {{language}} code for:
- {{criteria}}
- Performance
Use {{tone}} tone.`;
      expect(extractVariables(body)).toEqual(["role", "language", "criteria", "tone"]);
    });
  });

  describe("renderBody", () => {
    it("replaces variables with values", () => {
      const body = "Hello {{name}}, your role is {{role}}.";
      expect(renderBody(body, { name: "Alice", role: "admin" })).toBe("Hello Alice, your role is admin.");
    });

    it("leaves unresolved variables as-is", () => {
      const body = "Hello {{name}}, your score is {{score}}.";
      expect(renderBody(body, { name: "Bob" })).toBe("Hello Bob, your score is {{score}}.");
    });

    it("handles empty vars", () => {
      expect(renderBody("{{a}} {{b}}", {})).toBe("{{a}} {{b}}");
    });
  });
});