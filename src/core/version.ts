/**
 * Version entity — an immutable snapshot of a prompt's body + metadata at a
 * point in time. Versions are numbered sequentially starting at 1 (1-indexed).
 *
 * A "commit-like" message accompanies each version so `diff` and `log` output
 * is meaningful, mirroring git ergonomics.
 */

export interface Version {
  /** Stable unique id within the store. */
  id: string;
  /** Parent prompt id. */
  promptId: string;
  /** 1-indexed monotonically increasing number. */
  versionNumber: number;
  /** The prompt body at this version. */
  body: string;
  /** Variables declared in the body (snapshot for diffing). */
  variables: string[];
  /** Human-friendly commit message describing the change. */
  message: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
}

export interface VersionInput {
  promptId: string;
  body: string;
  message: string;
  variables?: string[];
}

/** Generate a deterministic-ish unique id (timestamp + random). */
export function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}${rand}`;
}
