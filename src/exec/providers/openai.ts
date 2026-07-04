import type { ExecInput, ExecResult, Provider } from "../provider.js";
import { requireEnv, ProviderConfigError } from "../provider.js";

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string } }>;
  model: string;
}

export class OpenAIProvider implements Provider {
  readonly id = "openai";
  constructor(
    private opts: { apiKey?: string; baseUrl?: string; model?: string } = {},
  ) {}

  async complete(input: ExecInput): Promise<ExecResult> {
    const apiKey = this.opts.apiKey ?? requireEnv("OPENAI_API_KEY");
    const baseUrl = this.opts.baseUrl ?? "https://api.openai.com/v1";
    const model = input.model ?? this.opts.model ?? "gpt-4o-mini";

    const messages: Array<Record<string, unknown>> = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.prompt });

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderConfigError(
        `OpenAI request failed (${res.status}): ${detail.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as OpenAIChatResponse;
    return {
      text: data.choices[0]?.message?.content ?? "",
      meta: { model: data.model, provider: "openai" },
    };
  }
}
