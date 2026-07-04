/**
 * JSON file-backed store with atomic writes and schema migrations.
 *
 * Design decision: We deliberately avoid SQLite to keep `npm install` instant
 * and fully portable across Windows/macOS/Linux without native compilation.
 * For the target scale (hundreds to low-thousands of prompts) a single JSON
 * file with in-memory filtering is more than sufficient and keeps the project
 * contributor-friendly.
 *
 * Writes are atomic: we write to `store.json.tmp` and rename, so a crash never
 * leaves the store in a corrupt half-written state.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createStoreData, CURRENT_SCHEMA_VERSION, type StoreData } from "./schema.js";
import { StoreError } from "../core/errors.js";

/** Default directory name for the local store. */
export const STORE_DIR = ".promptstash";
export const STORE_FILE = "store.json";

/** Resolve the store directory for a project root path (or home when --here omitted). */
export function resolveStoreDir(here = false): string {
  return here ? path.resolve(process.cwd(), STORE_DIR) : path.join(os.homedir(), STORE_DIR);
}

export function resolveStorePath(here = false): string {
  return path.join(resolveStoreDir(here), STORE_FILE);
}

/** Determine whether a store exists at the given location. */
export async function storeExists(here = false): Promise<boolean> {
  try {
    await fs.access(resolveStorePath(here));
    return true;
  } catch {
    return false;
  }
}

/** Resolve which store to use: prefer project-local (`--here`), fall back to home. */
export async function resolveStorePathAuto(): Promise<{ path: string; here: boolean }> {
  const local = resolveStorePath(true);
  try {
    await fs.access(local);
    return { path: local, here: true };
  } catch {
    return { path: resolveStorePath(false), here: false };
  }
}

export class Store {
  private data: StoreData;
  private readonly filePath: string;

  private constructor(filePath: string, data: StoreData) {
    this.filePath = filePath;
    this.data = data;
  }

  /** Create a new store file at the given directory (throws if it exists). */
  static async init(here = false): Promise<Store> {
    const file = resolveStorePath(here);
    const exists = await storeExists(here);
    if (exists) {
      return Store.open(here);
    }
    await fs.mkdir(path.dirname(file), { recursive: true });
    const data = createStoreData();
    const store = new Store(file, data);
    await store.persist();
    return store;
  }

  /** Open an existing store (throws NotInitializedError-equivalent if missing). */
  static async open(here = false): Promise<Store> {
    let file = resolveStorePath(here);
    let exists = await storeExists(here);
    if (!exists && here) {
      // Fall back to home store when project-local absent.
      file = resolveStorePath(false);
      exists = await storeExists(false);
    }
    if (!exists) {
      throw new StoreError(`No store found. Run \`promptstash init\` first.`);
    }
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    const migrated = await migrate(parsed);
    const store = new Store(file, migrated);
    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      await store.persist();
    }
    return store;
  }

  /** Open or auto-create a store (used by library consumers who want lazy init). */
  static async openOrCreate(here = false): Promise<Store> {
    if (await storeExists(here)) {
      return Store.open(here);
    }
    return Store.init(here);
  }

  get raw(): StoreData {
    return this.data;
  }

  get path(): string {
    return this.filePath;
  }

  /** Persist the in-memory data atomically to disk. */
  async persist(): Promise<void> {
    const tmp = `${this.filePath}.tmp`;
    const json = JSON.stringify(this.data, null, 2);
    await fs.writeFile(tmp, json, "utf8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { rename } = await import("node:fs/promises");
    await rename(tmp, this.filePath);
  }

  /** Replace in-memory data and persist. */
  async save(data: StoreData): Promise<void> {
    this.data = data;
    await this.persist();
  }
}

/**
 * Simple migration runner. v1 is the initial schema; future versions add cases.
 */
async function migrate(data: StoreData): Promise<StoreData> {
  let cur = data.schemaVersion ?? 0;
  if (cur === CURRENT_SCHEMA_VERSION) {
    return data;
  }
  // Avoid mutation of input: clone shallowly.
  const out = structuredClone(data);
  if (cur === 0) {
    // Pre-existing or fresh-but-untagged store — treat as v1 with defaults.
    if (!out.projects?.length) {
      const now = new Date().toISOString();
      out.projects = [
        { id: "default", name: "default", isDefault: true, createdAt: now, updatedAt: now },
      ];
    }
    out.prompts ??= [];
    out.versions ??= [];
    out.tags ??= [];
    out.schemaVersion = 1;
    cur = 1;
  }
  // Add future migrations here (`if (cur === 1) { ... cur = 2 }`).
  return out;
}
