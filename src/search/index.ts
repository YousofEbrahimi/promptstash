/**
 * Lightweight lexical search over prompts.
 *
 * Without SQLite FTS5 we implement simple case-insensitive substring scoring
 * across name, description, tags, and body of the latest version. This keeps
 * the core zero-native-dependency. A pluggable semantic search module is
 * scaffolded (off by default) for future opt-in heavier features.
 */

import type { StoreData } from "../store/schema.js";
import type { Prompt } from "../core/prompt.js";

export interface SearchHit {
  prompt: Prompt;
  /** 0-100 relevance score. */
  score: number;
  /** Matching fields. */
  matchedFields: string[];
  /** Latest body text (included so callers can render snippets). */
  body: string;
}

export function search(store: StoreData, query: string): SearchHit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const prompt of store.prompts) {
    const latest = store.versions
      .filter((v) => v.promptId === prompt.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!latest) continue;

    const fields: Record<string, string> = {
      name: prompt.name.toLowerCase(),
      description: (prompt.description ?? "").toLowerCase(),
      tags: prompt.tags.join(" ").toLowerCase(),
      body: latest.body.toLowerCase(),
    };

    let score = 0;
    const matchedFields = new Set<string>();
    for (const term of terms) {
      for (const [field, value] of Object.entries(fields)) {
        if (value.includes(term)) {
          matchedFields.add(field);
          // Weight field importance.
          score += field === "name" ? 40 : field === "tags" ? 25 : field === "description" ? 20 : 10;
        }
      }
    }
    if (score > 0) {
      hits.push({
        prompt,
        score: Math.min(100, score),
        matchedFields: [...matchedFields],
        body: latest.body,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score);
}

/**
 * Semantic search stub. Disabled by default; when the config flag
 * `semanticSearch` is true a future embedding-based search can be plugged in.
 * Currently throws a clear "not available" message so consumers can guard.
 */
export function semanticSearch(_store: StoreData, _query: string): SearchHit[] {
  throw new Error(
    "Semantic search is not enabled. Enable it in config: `promptstash config set semanticSearch true`.",
  );
}
