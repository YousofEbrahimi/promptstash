import type { ExecInput, ExecResult, Provider } from "../provider.js";
import { requireEnv, ProviderConfigError } from "../provider.js";

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
}

export class AnthropicProvider implements Provider {
  readonly id = "anthropic";
  constructor(
    private opts: { apiKey?: string; baseUrl?: string; model?: string } = {},
  ) {}

  async complete(input: ExecInput): Promise<ExecResult> {
    const apiKey = this.opts.apiKey ?? requireEnv("ANTHROPIC_API_KEY");
    const baseUrl = this.opts.baseUrl ?? "https://api.anthropic.com/v1";
    const model = input.model ?? this.opts.model ?? "claude-3-5-sonnet-20241022";

    const body: Record<string, unknown> = {
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: input.prompt }],
    };
    if (input.system) body.system = input.system;

    const res = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderConfigError(
        `Anthropic request failed (${res.status}): ${detail.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as AnthropicResponse;
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    return { text, meta: { model: data.model, provider: "anthropic" } };
  }
}
