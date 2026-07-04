# Providers

promptstash exec supports multiple LLM providers via a pluggable adapter system.

## Supported providers

| Provider | ID | Required env var | Notes |
|----------|----|-----------------|-------|
| Mock (default) | `mock` | None | Deterministic, offline, for testing/preview |
| OpenAI | `openai` | `OPENAI_API_KEY` | GPT-4o, GPT-4o-mini, etc. |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | Claude 3.5 Sonnet, etc. |
| Ollama (local) | `ollama` | None (localhost) | No API key needed |

## Adding a new provider

Create `src/exec/providers/<provider-name>.ts`:

```ts
import type { ExecInput, ExecResult, Provider } from "../provider.js";

export class MyProvider implements Provider {
  readonly id = "myprovider";

  async complete(input: ExecInput): Promise<ExecResult> {
    // 1. Build your request using OPENAI_API_KEY or MYPROVIDER_API_KEY
    const apiKey = process.env.MYPROVIDER_API_KEY;
    if (!apiKey) throw new Error("Set MYPROVIDER_API_KEY");

    // 2. Call the API
    const response = await fetch("https://api.myprovider.com/v1/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input.prompt }),
    });

    // 3. Return ExecResult
    const data = await response.json() as { text: string };
    return {
      text: data.text,
      meta: { provider: "myprovider" },
    };
  }
}
```

Register in `src/exec/index.ts`:

```ts
import { MyProvider } from "./providers/myprovider.js";
providers.set("myprovider", () => new MyProvider());
```

Add tests in `tests/unit/providers/myprovider.test.ts`.

## Provider API

```ts
interface Provider {
  readonly id: string;
  complete(input: ExecInput): Promise<ExecResult>;
}

interface ExecInput {
  prompt: string;       // Rendered body with variables injected
  system?: string;      // Optional system message
  model?: string;       // Model override (optional)
}

interface ExecResult {
  text: string;         // The completion text
  meta: Record<string, unknown>;  // Provider-specific metadata
}
```