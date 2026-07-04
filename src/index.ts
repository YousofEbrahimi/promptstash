import { Store } from "./store/index.js";
import { PromptRepository, type CreatePromptBody } from "./store/repository/prompt_repo.js";
import type { Prompt } from "./core/prompt.js";
import type { Version } from "./core/version.js";
import { diffVersions } from "./diff/prompt-diff.js";
import { search } from "./search/index.js";
import type { SearchHit } from "./search/index.js";
import { renderBody, extractVariables } from "./core/prompt.js";
import type { Config } from "./config/index.js";
import { readConfig } from "./config/index.js";
import { renderCard } from "./render/card.js";
import { startWebServer, type WebServerHandle, type WebServerOptions } from "./web/server.js";

export type { Prompt, Version, SearchHit, Config };
export type { WebServerHandle, WebServerOptions };
export { startWebServer };
export { renderCard };

/**
 * Promptstash public API — importable as a library.
 *
 * Usage:
 * ```ts
 * import { Promptstash } from "promptstash";
 * const ps = await Promptstash.open();
 * await ps.add("code-reviewer", "Review this {{language}} code...");
 * const result = await ps.diff("code-reviewer", 1, 2);
 * const web = await ps.web({ port: 6363 }); // local dashboard
 * ```
 */
export class Promptstash {
  private _store: Store;
  private _repo: PromptRepository;
  private readonly _here: boolean;

  private constructor(store: Store, repo: PromptRepository, here = false) {
    this._store = store;
    this._repo = repo;
    this._here = here;
  }

  /** Open the global store, creating it if absent. */
  static async open(here = false): Promise<Promptstash> {
    const store = await Store.openOrCreate(here);
    return new Promptstash(store, new PromptRepository(store.raw), here);
  }

  /** Open the store, throwing if it does not exist. */
  static async openExisting(here = false): Promise<Promptstash> {
    const store = await Store.open(here);
    return new Promptstash(store, new PromptRepository(store.raw), here);
  }

  /** Initialize a new store. */
  static async init(here = false): Promise<Promptstash> {
    const store = await Store.init(here);
    return new Promptstash(store, new PromptRepository(store.raw), here);
  }

  // -- Prompts --

  list(opts?: { tag?: string; query?: string }): Prompt[] {
    return this._repo.list(opts);
  }

  get(name: string): Prompt {
    return this._repo.get(name);
  }

  exists(name: string): boolean {
    return this._repo.exists(name);
  }

  async add(name: string, body: string, opts?: Partial<CreatePromptBody>): Promise<{ prompt: Prompt; version: Version }> {
    const result = this._repo.create({ name, body, ...opts });
    await this._store.persist();
    return result;
  }

  async update(name: string, input: { body?: string; message?: string; tags?: string[]; description?: string }): Promise<{ prompt: Prompt; version: Version }> {
    const result = this._repo.update(name, input);
    await this._store.persist();
    return result;
  }

  async remove(name: string): Promise<void> {
    this._repo.remove(name);
    await this._store.persist();
  }

  // -- Versions --

  versions(name: string): Version[] {
    return this._repo.versions(name);
  }

  version(name: string, versionNumber: number): Version {
    return this._repo.version(name, versionNumber);
  }

  latestVersion(name: string): Version {
    return this._repo.latestVersion(name);
  }

  async diff(name: string, v1: number, v2?: number): Promise<ReturnType<typeof diffVersions>> {
    const v1ver = this._repo.version(name, v1);
    const v2ver = v2 ? this._repo.version(name, v2) : this._repo.latestVersion(name);
    return diffVersions(v1ver, v2ver);
  }

  // -- Tags --

  async setTag(name: string, tag: string, versionNumber?: number): Promise<void> {
    this._repo.setTag(name, tag, versionNumber);
    await this._store.persist();
  }

  async removeTag(name: string, tag: string): Promise<void> {
    this._repo.removeTag(name, tag);
    await this._store.persist();
  }

// -- Render --

  /**
   * Render a prompt body string with variables injected.
   * Unresolved variables are left as-is ({{name}} appears in output unchanged).
   *
   * To render a named prompt, fetch its latest body first:
   *   const body = ps.latestVersion("my-prompt").body;
   *   const rendered = ps.render(body, { name: "Alice" });
   */
  render(body: string, vars: Record<string, string>): string {
    return renderBody(body, vars);
  }

  /** Extract variables from a prompt body. */
  extractVariables(body: string): string[] {
    return extractVariables(body);
  }

  // -- Search --

  search(query: string): SearchHit[] {
    return search(this._store.raw, query);
  }

  // -- Web dashboard --

  /**
   * Start a read-only local web dashboard over this store's prompts.
   * Resolves once the HTTP server is listening. Bind to loopback only.
   *
   * ```ts
   * const ps = await Promptstash.open();
   * const handle = await ps.web({ port: 6363 });
   * // open http://127.0.0.1:6363 in a browser
   * await handle.close();
   * ```
   */
  web(opts?: WebServerOptions & { here?: boolean }): Promise<WebServerHandle> {
    // Default `here` to the scope this instance was opened with, so a
    // project-local `Promptstash.open(true)` instance serves its own store
    // rather than silently falling back to the global/home store.
    // Note: the web server opens its own Store handle so the dashboard always
    // reflects the latest persisted state rather than this instance's snapshot.
    return startWebServer({ ...opts, here: opts?.here ?? this._here });
  }

  // -- Config --

  async getConfig(): Promise<Config> {
    return readConfig();
  }

  /** Path to the underlying store file. */
  get storePath(): string {
    return this._store.path;
  }
}

export default Promptstash;
