import type { ExecInput, ExecResult, Provider } from "../provider.js";

/** Deterministic mock provider for tests and `--dry-run` previews. */
export class MockProvider implements Provider {
  readonly id = "mock";
  async complete(input: ExecInput): Promise<ExecResult> {
    return {
      text: `[mock] ${input.prompt.slice(0, 80)}${input.prompt.length > 80 ? "..." : ""}`,
      meta: { model: "mock-1", provider: "mock" },
    };
  }
}
