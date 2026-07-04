/**
 * Search over prompts.
 *
 * Two modes:
 *  - `search`        — lexical, substring-based, fast
 *  - `semanticSearch` — TF-IDF + cosine similarity, pluggable to neural embeddings later
 *
 * See tfidf.ts for the semantic implementation details.
 */

import type { StoreData } from "../store/schema.js";
import type { Prompt } from "../core/prompt.js";
import { buildCorpusIdf, cosine, vectorize } from "./tfidf.js";

export interface SearchHit {
  prompt: Prompt;
  /** 0-100 relevance score. */
  score: number;
  /** Matching fields. */
  matchedFields: string[];
  /** Latest body text (included so callers can render snippets). */
  body: string;
}

/** Latest version body for a given prompt id, or empty string if absent. */
function latestBody(store: StoreData, promptId: string): string {
  const v = store.versions
    .filter((x) => x.promptId === promptId)
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  return v?.body ?? "";
}

export function search(store: StoreData, query: string): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const prompt of store.prompts) {
    const body = latestBody(store, prompt.id);

    const fields: Record<string, string> = {
      name: prompt.name.toLowerCase(),
      description: (prompt.description ?? "").toLowerCase(),
      tags: prompt.tags.join(" ").toLowerCase(),
      body: body.toLowerCase(),
    };

    let score = 0;
    const matchedFields = new Set<string>();
    for (const term of terms) {
      for (const [field, value] of Object.entries(fields)) {
        if (value.includes(term)) {
          matchedFields.add(field);
          score +=
            field === "name"
              ? 40
              : field === "tags"
                ? 25
                : field === "description"
                  ? 20
                  : 10;
        }
      }
    }
    if (score > 0) {
      hits.push({
        prompt,
        score: Math.min(100, score),
        matchedFields: [...matchedFields],
        body,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score);
}

/**
 * Cached corpus index: IDF map + per-prompt document vectors precomputed from
 * the store. Recomputed only when the corpus signature changes (prompt count,
 * version count, aggregate text length), so repeated `semanticSearch` calls
 * over an unchanged store skip the O(N·len) rebuild.
 */
interface CorpusIndex {
  idf: Record<string, number>;
  docs: { promptId: string; vec: { weights: Record<string, number>; norm: number }; body: string }[];
  signature: string;
}

let cachedIndex: { storeRef: StoreData; index: CorpusIndex } | null = null;

function corpusSignature(store: StoreData): string {
  // Cheap to compute; distinguishes any structural change to the corpus.
  let len = 0;
  for (const v of store.versions) len += v.body.length;
  return `${store.prompts.length}:${store.versions.length}:${len}`;
}

function getCorpusIndex(store: StoreData): CorpusIndex {
  if (cachedIndex && cachedIndex.storeRef === store && cachedIndex.index.signature === corpusSignature(store)) {
    return cachedIndex.index;
  }
  const idf = buildCorpusIdf(store);
  const docs: CorpusIndex["docs"] = [];
  for (const p of store.prompts) {
    const body = latestBody(store, p.id);
    const docText = [p.name, p.tags.join(" "), p.description ?? "", body].join(" ");
    docs.push({ promptId: p.id, vec: vectorize(docText, idf), body });
  }
  const index: CorpusIndex = { idf, docs, signature: corpusSignature(store) };
  cachedIndex = { storeRef: store, index };
  return index;
}

/** Drop the cached corpus index (useful after in-process store mutations). */
export function invalidateSemanticCache(): void {
  cachedIndex = null;
}

/**
 * Semantic search using TF-IDF + cosine similarity.
 *
 * Each prompt is treated as a document composed of name + tags + description +
 * latest body. The full corpus IDF and document vectors are built lazily and
 * cached until the corpus signature changes, so repeated queries over an
 * unchanged store are cheap. Scores are cosine × 100 mapped to 0..100.
 *
 * Returns the same `SearchHit` shape as lexical search so callers can treat
 * them uniformly.
 */
export function semanticSearch(store: StoreData, query: string): SearchHit[] {
  if (store.prompts.length === 0) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const index = getCorpusIndex(store);
  const queryVec = vectorize(trimmed, index.idf);
  if (queryVec.norm === 0) return [];

  const hits: SearchHit[] = [];
  for (const p of store.prompts) {
    const doc = index.docs.find((d) => d.promptId === p.id);
    if (!doc) continue;
    const score = cosine(queryVec, doc.vec);
    if (score > 0.05) {
      hits.push({
        prompt: p,
        score: Math.min(100, score * 100),
        // For semantic search, "matched fields" is informational only;
        // we synthesize a label so the CLI can render it consistently.
        matchedFields: ["semantic"],
        body: doc.body,
      });
    }
  }
  return hits.sort((a, b) => b.score - a.score);
}
