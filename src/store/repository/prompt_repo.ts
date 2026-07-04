import type { StoreData } from "../schema.js";
import type { Prompt } from "../../core/prompt.js";
import type { Version } from "../../core/version.js";
import { generateId } from "../../core/version.js";
import { validatePromptName, extractVariables } from "../../core/prompt.js";
import {
  PromptNotFoundError,
  PromptExistsError,
  InvalidPromptNameError,
  VersionNotFoundError,
} from "../../core/errors.js";

/** Repository for Prompt entities with their associated Version records. */

export interface CreatePromptBody {
  name: string;
  body: string;
  description?: string;
  tags?: string[];
  variables?: string[];
  message?: string;
  force?: boolean;
}

export class PromptRepository {
  constructor(private store: StoreData) {}

  list(opts?: { tag?: string; query?: string }): Prompt[] {
    let out = this.store.prompts;
    if (opts?.tag) out = out.filter((p) => p.tags.includes(opts.tag!));
    if (opts?.query) {
      const q = opts.query.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      );
    }
    return [...out].sort((a, b) => a.name.localeCompare(b.name));
  }

  get(name: string): Prompt {
    const p = this.store.prompts.find((x) => x.name === name);
    if (!p) throw new PromptNotFoundError(name);
    return p;
  }

  exists(name: string): boolean {
    return this.store.prompts.some((x) => x.name === name);
  }

  /** Create a prompt at version 1. Throws if the name is taken (unless force). */
  create(input: CreatePromptBody): { prompt: Prompt; version: Version } {
    if (!validatePromptName(input.name)) {
      throw new InvalidPromptNameError(input.name);
    }
    if (this.exists(input.name)) {
      if (input.force) {
        return this.update(input.name, {
          body: input.body,
          message: input.message,
          tags: input.tags,
        });
      }
      throw new PromptExistsError(input.name);
    }
    const now = new Date().toISOString();
    const variables = input.variables ?? extractVariables(input.body);
    const prompt: Prompt = {
      id: generateId(),
      name: input.name,
      description: input.description,
      tags: input.tags ?? [],
      variables,
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    const version: Version = {
      id: generateId(),
      promptId: prompt.id,
      versionNumber: 1,
      body: input.body,
      variables,
      message: input.message ?? "Initial version",
      createdAt: now,
    };
    this.store.prompts.push(prompt);
    this.store.versions.push(version);
    return { prompt, version };
  }

  /** Create a new version of an existing prompt (immutable history). */
  update(
    name: string,
    input: {
      body?: string;
      message?: string;
      tags?: string[];
      description?: string;
    },
  ): { prompt: Prompt; version: Version } {
    const prompt = this.get(name);
    const latest = this.latestVersion(name);
    const body = input.body ?? latest.body;
    const variables = input.body ? extractVariables(input.body) : latest.variables;
    const next: Version = {
      id: generateId(),
      promptId: prompt.id,
      versionNumber: prompt.currentVersion + 1,
      body,
      variables,
      message: input.message ?? `Update to v${prompt.currentVersion + 1}`,
      createdAt: new Date().toISOString(),
    };
    prompt.currentVersion = next.versionNumber;
    if (input.tags) prompt.tags = input.tags;
    if (input.description !== undefined) prompt.description = input.description;
    prompt.variables = variables;
    prompt.updatedAt = next.createdAt;
    this.store.versions.push(next);
    return { prompt, version: next };
  }

  remove(name: string): void {
    const prompt = this.get(name);
    this.store.prompts = this.store.prompts.filter((p) => p.id !== prompt.id);
    this.store.versions = this.store.versions.filter((v) => v.promptId !== prompt.id);
    this.store.tags = this.store.tags.filter((t) => t.promptId !== prompt.id);
  }

  versions(name: string): Version[] {
    const prompt = this.get(name);
    return this.store.versions
      .filter((v) => v.promptId === prompt.id)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  version(name: string, versionNumber: number): Version {
    const prompt = this.get(name);
    const v = this.store.versions.find(
      (x) => x.promptId === prompt.id && x.versionNumber === versionNumber,
    );
    if (!v) throw new VersionNotFoundError(name, versionNumber);
    return v;
  }

  latestVersion(name: string): Version {
    const vs = this.versions(name);
    if (vs.length === 0) {
      throw new PromptNotFoundError(name);
    }
    return vs[vs.length - 1];
  }

  setTag(name: string, tagName: string, versionNumber?: number): void {
    const prompt = this.get(name);
    const vn = versionNumber ?? prompt.currentVersion;
    const existing = this.store.versions.find(
      (v) => v.promptId === prompt.id && v.versionNumber === vn,
    );
    if (!existing) throw new VersionNotFoundError(name, vn);
    if (!prompt.tags.includes(tagName)) {
      prompt.tags.push(tagName);
    }
    this.store.tags = this.store.tags.filter(
      (t) => !(t.promptId === prompt.id && t.name === tagName),
    );
    this.store.tags.push({
      name: tagName,
      promptId: prompt.id,
      versionNumber: vn,
      createdAt: new Date().toISOString(),
    });
  }

  removeTag(name: string, tagName: string): void {
    const prompt = this.get(name);
    this.store.tags = this.store.tags.filter(
      (t) => !(t.promptId === prompt.id && t.name === tagName),
    );
    prompt.tags = prompt.tags.filter((t) => t !== tagName);
  }
}
