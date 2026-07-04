/**
 * Shared helpers used across CLI commands.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import type { Prompt } from "../core/prompt.js";
import type { Version } from "../core/version.js";
import { Store } from "../store/index.js";
import { PromptRepository } from "../store/repository/prompt_repo.js";

/** Open the active store + prompt repo pair (auto-resolves here vs home). */
export async function openStore(): Promise<{ store: Store; repo: (s: Store) => PromptRepository }> {
  const store = await Store.open(false);
  return { store, repo: (s) => new PromptRepository(s.raw) };
}

/** Read a prompt body from stdin or a file option. */
export async function readBody(opts: { file?: string; stdin?: boolean }): Promise<string> {
  if (opts.file) {
    return fs.readFile(path.resolve(opts.file), "utf8");
  }
  if (opts.stdin && !process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString("utf8");
  }
  throw new Error("No body provided. Pass --file <path> or pipe via stdin.");
}

/** Serialize a prompt + version to the `.prompt.md` format (frontmatter + body). */
export function serializePrompt(prompt: Prompt, version: Version): string {
  const front = {
    name: prompt.name,
    description: prompt.description ?? "",
    tags: prompt.tags,
    variables: version.variables,
    version: version.versionNumber,
  };
  return matter.stringify(version.body, front);
}

/** Parse a `.prompt.md`-style document into body + metadata. */
export function parsePromptDocument(content: string): {
  body: string;
  data: Record<string, unknown>;
} {
  const { content: body, data } = matter(content);
  return { body: body.replace(/^\n+/, ""), data: data as Record<string, unknown> };
}
