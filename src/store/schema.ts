/**
 * In-memory shape of the promptstash local store (`.promptstash/store.json`).
 *
 * The store is a single JSON document persisted atomically (write-to-temp then
 * rename) to survive crashes. This avoids native dependencies (SQLite) and
 * keeps `npm install` instant and cross-platform — a core UX requirement for
 * a viral CLI.
 */

import type { Prompt } from "../core/prompt.js";
import type { Tag } from "../core/tag.js";
import type { Version } from "../core/version.js";
import type { Project } from "../core/project.js";

export interface StoreData {
  schemaVersion: number;
  projects: Project[];
  prompts: Prompt[];
  versions: Version[];
  tags: Tag[];
}

/** Current schema version; used by the migration runner. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Build a fresh empty store initialized with a default project. */
export function createStoreData(now = new Date().toISOString()): StoreData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projects: [
      {
        id: "default",
        name: "default",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    prompts: [],
    versions: [],
    tags: [],
  };
}
