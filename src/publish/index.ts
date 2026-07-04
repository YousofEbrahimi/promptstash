/**
 * Publisher abstraction — pluggable adapters for shipping a prompt (and/or its
 * share card) to an external destination.
 *
 * This indirection is intentional: contributors can add new publishers
 * (Pastebin, GitHub gist, R2, etc.) by implementing the `Publisher` interface
 * and registering via `getPublisher`. Default out-of-the-box: `local` (writes
 * the SVG + a `.prompt.md` next to the store) which is fully offline and safe.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { Prompt } from "../core/prompt.js";
import type { Version } from "../core/version.js";

export interface PublishResult {
  /** Public or local URL/path to the shared artifact. */
  url: string;
  /** Human label describing where it was published. */
  label: string;
}

export interface PublishInput {
  prompt: Prompt;
  version: Version;
  /** SVG card bytes. */
  card: string;
  /** Rendered prompt body (with frontmatter). */
  body: string;
}

export interface Publisher {
  id: string;
  /** Publish the share input and return a result (url + label). */
  publish(input: PublishInput): Promise<PublishResult>;
}

/** Built-in local publisher — writes artifacts next to the store, always works offline. */
export class LocalPublisher implements Publisher {
  readonly id = "local";
  constructor(private outDir: string) {}

  async publish(input: PublishInput): Promise<PublishResult> {
    await fs.mkdir(this.outDir, { recursive: true });
    const base = path.join(this.outDir, `${input.prompt.name}-v${input.version.versionNumber}`);
    await fs.writeFile(`${base}.svg`, input.card, "utf8");
    await fs.writeFile(`${base}.prompt.md`, input.body, "utf8");
    return { url: path.resolve(`${base}.svg`), label: "local share" };
  }
}

/** Registry of publisher ids to factory functions. */
const publishers = new Map<string, (config: Record<string, unknown>) => Publisher>();
publishers.set("local", (c) => new LocalPublisher((c.outDir as string) ?? "./.promptstash/shares"));

export function registerPublisher(
  id: string,
  factory: (config: Record<string, unknown>) => Publisher,
): void {
  publishers.set(id, factory);
}

export function getPublisher(
  id: string,
  config: Record<string, unknown> = {},
): Publisher {
  const factory = publishers.get(id);
  if (!factory) {
    throw new PublisherNotFoundError(id);
  }
  return factory(config);
}

export function listPublisherIds(): string[] {
  return [...publishers.keys()];
}

/** Companion error (local to this module to keep errors.ts lean-ish). */
export class PublisherNotFoundError extends Error {
  constructor(id: string) {
    super(`Publisher "${id}" not found. Available: ${listPublisherIds().join(", ")}`);
    this.name = "PublisherNotFoundError";
  }
}
