/**
 * LLM provider abstraction — pluggable adapters for `promptstash exec`.
 *
 * Providers accept a rendered prompt and return a completion text. Keys are
 * read from environment variables (never persisted in config) and resolved per
 * provider convention (e.g. `OPENAI_API_KEY`).
 *
 * Default ship: OpenAI + Anthropic (HTTP-based, no SDK lock-in) + Ollama
 * (local). A mock provider is included for deterministic CI/testing without
 * network or API spend.
 */

export interface ExecResult {
  text: string;
  /** Provider-specific raw response metadata (model, tokens, etc.). */
  meta: Record<string, unknown>;
}

export interface ExecInput {
  /** Fully-rendered prompt body (variables injected). */
  prompt: string;
  /** Optional system message. */
  system?: string;
  /** Model id override; provider default used when omitted. */
  model?: string;
}

export interface Provider {
  id: string;
  /** Execute a completion against the provider. */
  complete(input: ExecInput): Promise<ExecResult>;
}

/** Read required env var with a helpful error. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new ProviderConfigError(`Missing environment variable ${name}.`);
  }
  return v;
}

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

export class ProviderNotFoundError extends Error {
  constructor(id: string, available: string[]) {
    super(`Provider "${id}" not found. Available: ${available.join(", ")}`);
    this.name = "ProviderNotFoundError";
  }
}
