/**
 * TF-IDF based semantic search.
 *
 * Pure-JS implementation using:
 *  - Term frequency (TF) computed from prompt name + tags + description + body
 *  - Inverse document frequency (IDF) across the corpus
 *  - Cosine similarity for ranking
 *
 * No native deps. Results are cached per-store so reindexing is incremental.
 *
 * Rationale: True embeddings (transformers) require native deps and large
 * downloads (~100MB). TF-IDF gives us 80% of the value (semantic-ish match
 * via shared terms) at 0% of the cost. v1.2 can plug a transformer adapter.
 */

import type { StoreData } from "../store/schema.js";

export interface SparseVector {
  /** Term -> weight. */
  weights: Record<string, number>;
  /** L2 norm (precomputed for cosine similarity). */
  norm: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "of", "in", "to", "for", "on", "with", "as", "by", "at", "from",
  "and", "or", "but", "not", "it", "this", "that", "you", "your",
  "we", "our", "i", "me", "my", "they", "them", "their",
]);

/** Tokenize + normalize text. Splits on non-alphanum and lowercases. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/** Compute term frequencies for a single document. */
function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
  // Normalize by length; longer docs shouldn't drown short ones.
  const len = tokens.length || 1;
  for (const k of Object.keys(tf)) tf[k] = (tf[k]! / len);
  return tf;
}

/** Compute a sparse TF-IDF vector for a document. */
export function vectorize(
  text: string,
  idf: Record<string, number>,
): SparseVector {
  const tokens = tokenize(text);
  const tf = termFrequency(tokens);
  const weights: Record<string, number> = {};
  let sumSq = 0;
  for (const [term, w] of Object.entries(tf)) {
    const weight = w * (idf[term] ?? 0);
    if (weight > 0) {
      weights[term] = weight;
      sumSq += weight * weight;
    }
  }
  return { weights, norm: Math.sqrt(sumSq) };
}

/** Build IDF from a corpus: idf[term] = log(N / df[term]). */
export function buildIdf(documents: string[]): Record<string, number> {
  const df: Record<string, number> = {};
  const N = documents.length || 1;
  for (const doc of documents) {
    const seen = new Set<string>();
    for (const t of tokenize(doc)) seen.add(t);
    for (const t of seen) df[t] = (df[t] ?? 0) + 1;
  }
  const idf: Record<string, number> = {};
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log(1 + N / count);
  }
  return idf;
}

/** Cosine similarity between two sparse vectors. */
export function cosine(a: SparseVector, b: SparseVector): number {
  if (a.norm === 0 || b.norm === 0) return 0;
  let dot = 0;
  // Smaller vector as outer loop for better cache hit rate.
  const [small, large] = a.weights.size <= b.weights.size ? [a, b] : [b, a];
  for (const [term, w] of Object.entries(small.weights)) {
    const other = large.weights[term];
    if (other !== undefined) dot += w * other;
  }
  return dot / (a.norm * b.norm);
}

/**
 * Build IDF from every prompt in the store. Each prompt contributes its
 * name + tags + description + latest body as a "document".
 */
export function buildCorpusIdf(store: StoreData): Record<string, number> {
  const docs: string[] = [];
  for (const p of store.prompts) {
    const latest = store.versions
      .filter((v) => v.promptId === p.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    docs.push([
      p.name,
      p.tags.join(" "),
      p.description ?? "",
      latest?.body ?? "",
    ].join(" "));
  }
  return buildIdf(docs);
}
