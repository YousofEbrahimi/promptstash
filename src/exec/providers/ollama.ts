import type { ExecInput, ExecResult, Provider } from "../provider.js";
import { ProviderConfigError } from "../provider.js";

interface OllamaResponse {
  response: string;
  model: string;
}

export class OllamaProvider implements Provider {
  readonly id = "ollama";
  constructor(
    private opts: { baseUrl?: string; model?: string } = {},
  ) {}

  async complete(input: ExecInput): Promise<ExecResult> {
    const baseUrl = this.opts.baseUrl ?? "http://localhost:11434";
    const model = input.model ?? this.opts.model ?? "llama3";

    const prompt = input.system ? `${input.system}\n\n${input.prompt}` : input.prompt;
    const body: Record<string, unknown> = { model, prompt, stream: false };

    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderConfigError(
        `Ollama request failed (${res.status}). Is \`ollama serve\` running at ${baseUrl}? Detail: ${detail.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as OllamaResponse;
    return { text: data.response ?? "", meta: { model: data.model, provider: "ollama" } };
  }
}
