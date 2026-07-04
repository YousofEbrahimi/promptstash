/**
 * Configuration management.
 *
 * Two-tier config: global (`~/.promptstash/config.json`) overridable by
 * project-local (`.promptstash/config.json`). We deliberately avoid external
 * rc libraries to keep the dependency footprint small and surface area obvious.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export const STORE_DIR = ".promptstash";
export const CONFIG_FILE = "config.json";

export interface Config {
  /** Default LLM provider id for `promptstash exec`. */
  defaultProvider?: string;
  /** Provider-specific settings (API keys read from env, not stored here). */
  providers?: Record<string, { baseUrl?: string; model?: string }>;
  /** Default publisher for `promptstash share`. */
  defaultPublisher?: string;
  /** Publisher-specific settings. */
  publishers?: Record<string, Record<string, unknown>>;
  /** Enable experimental semantic search. */
  semanticSearch?: boolean;
}

const DEFAULT_CONFIG: Config = {};

export function globalConfigPath(): string {
  return path.join(os.homedir(), STORE_DIR, CONFIG_FILE);
}

export function localConfigPath(): string {
  return path.resolve(process.cwd(), STORE_DIR, CONFIG_FILE);
}

/** Read merged config (local overrides global). */
export async function readConfig(): Promise<Config> {
  const global = await readSafe(globalConfigPath());
  const local = await readSafe(localConfigPath());
  return merge(global, local);
}

async function readSafe(p: string): Promise<Config> {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

function merge(a: Config, b: Config): Config {
  return {
    ...DEFAULT_CONFIG,
    ...a,
    ...b,
    providers: { ...a.providers, ...b.providers },
    publishers: { ...a.publishers, ...b.publishers },
  };
}

/** Write config to either global or local scope. */
export async function writeConfig(
  scope: "global" | "local",
  config: Config,
): Promise<void> {
  const file = scope === "global" ? globalConfigPath() : localConfigPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(config, null, 2), "utf8");
}

/** Set a single nested key (dotted, e.g. "publishers.gist.token") at a scope. */
export async function setConfigValue(
  scope: "global" | "local",
  key: string,
  value: unknown,
): Promise<Config> {
  const file = scope === "global" ? globalConfigPath() : localConfigPath();
  const existing = await readSafe(file);
  const dotted = key.split(".");
  let target: Record<string, unknown> = existing as Record<string, unknown>;
  for (let i = 0; i < dotted.length - 1; i++) {
    const k = dotted[i]!;
    const next = (target[k] as Record<string, unknown> | undefined) ?? {};
    target[k] = next;
    target = next;
  }
  target[dotted[dotted.length - 1]!] = value;
  // mutation is complete; write the modified object (target === existing)
  await writeConfig(scope, existing);
  return existing;
}
