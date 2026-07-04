/**
 * Provider registry + resolution. The mock provider is always registered so
 * `promptstash exec --provider mock` works offline deterministically (and in CI).
 */

import type { ExecInput, ExecResult, Provider } from "./provider.js";
import { ProviderNotFoundError } from "./provider.js";
import { MockProvider } from "./providers/mock.js";
import { OpenAIProvider } from "./providers/openai.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OllamaProvider } from "./providers/ollama.js";

const providers = new Map<string, () => Provider>();

providers.set("mock", () => new MockProvider());
providers.set("openai", () => new OpenAIProvider());
providers.set("anthropic", () => new AnthropicProvider());
providers.set("ollama", () => new OllamaProvider());

export function registerProvider(id: string, factory: () => Provider): void {
  providers.set(id, factory);
}

export function getProvider(id: string): Provider {
  const factory = providers.get(id);
  if (!factory) throw new ProviderNotFoundError(id, listProviderIds());
  return factory();
}

export function listProviderIds(): string[] {
  return [...providers.keys()];
}

/** Convenience: directly execute via a provider id. */
export async function execute(
  providerId: string,
  input: ExecInput,
): Promise<ExecResult> {
  return getProvider(providerId).complete(input);
}

export type { Provider, ExecInput, ExecResult };
