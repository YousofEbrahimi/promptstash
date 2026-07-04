/**
 * Local web dashboard server.
 *
 * Zero-dependency HTTP server built on Node's `node:http` module. Serves a
 * JSON REST API over the user's promptstash store plus a single-page dashboard
 * (see dashboard.ts) at the root path.
 *
 * Philosophy: same as the rest of the project — no native deps, no cloud.
 * The dashboard is a read-only viewer over the local store; writes stay in the
 * CLI (or library). This keeps the web surface small and safe by default.
 *
 * Routes:
 *   GET  /                         -> dashboard HTML
 *   GET  /api/info                 -> { storePath, promptCount, versionCount }
 *   GET  /api/prompts               -> Prompt[]
 *   GET  /api/prompts/:name         -> Prompt
 *   GET  /api/prompts/:name/versions       -> Version[]
 *   GET  /api/prompts/:name/versions/:n     -> Version
 *   GET  /api/prompts/:name/diff/:a/:b     -> PromptDiffResult (variable changes as arrays)
 *   GET  /api/search?q=&semantic=1 -> SearchHit[]
 *   GET  /api/health               -> { ok: true }
 */

import http, { type Server } from "node:http";
import { Store } from "../store/index.js";
import { PromptRepository } from "../store/repository/prompt_repo.js";
import { search, semanticSearch, type SearchHit } from "../search/index.js";
import { diffVersions } from "../diff/prompt-diff.js";
import { PromptNotFoundError, VersionNotFoundError } from "../core/errors.js";
import { dashboardHtml } from "./dashboard.js";

export interface WebServerOptions {
  /** TCP port. Default 6363 (0x6363 -> ascii "ci" of indigo hex vibe). */
  port?: number;
  /** Bind address. Default "127.0.0.1" (loopback only — never expose remotely). */
  host?: string;
  /** Use project-local store. */
  here?: boolean;
}

export interface WebServerHandle {
  readonly port: number;
  readonly host: string;
  close(): Promise<void>;
}

const DEFAULT_PORT = 6363;
const DEFAULT_HOST = "127.0.0.1";

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function badRequest(res: http.ServerResponse, message: string): void {
  json(res, 400, { error: message });
}

function notFound(res: http.ServerResponse, message: string): void {
  json(res, 404, { error: message });
}

function serverError(res: http.ServerResponse, message: string): void {
  json(res, 500, { error: message });
}

/** Decode a percent-encoded path/query segment safely. Returns null on malformed input. */
function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}

/** Map an internal error to an HTTP status + message. */
function handleError(res: http.ServerResponse, err: unknown): void {
  if (err instanceof PromptNotFoundError) {
    notFound(res, "Prompt not found");
    return;
  }
  if (err instanceof VersionNotFoundError) {
    notFound(res, "Version not found");
    return;
  }
  if (err instanceof Error && err.name === "URIError") {
    badRequest(res, "Malformed URL encoding");
    return;
  }
  // Don't leak internal error text (filesystem paths, store internals) to the
  // HTTP client. Log the full error server-side instead.
  // eslint-disable-next-line no-console
  if (err instanceof Error && process != null) {
    console.error("[promptstash web] request error:", err);
  }
  serverError(res, "Internal error");
}

interface RouteParams {
  name?: string;
  version?: string;
  a?: string;
  b?: string;
}

/** Match a path against a pattern with ":param" segments. Returns null on no
 * match, or a `"bad"` sentinel string to signal malformed percent-encoding. */
function matchPath(pattern: string, path: string): RouteParams | null {
  const pSegs = pattern.split("/").filter(Boolean);
  const aSegs = path.split("/").filter(Boolean);
  if (pSegs.length !== aSegs.length) return null;
  const params: RouteParams = {};
  for (let i = 0; i < pSegs.length; i++) {
    const p = pSegs[i]!;
    const a = aSegs[i]!;
    if (p.startsWith(":")) {
      (params as Record<string, string>)[p.slice(1)] = decodeURIComponent(a);
    } else if (p !== a) {
      return null;
    }
  }
  return params;
}

function parseQuery(url: string): Record<string, string> {
  const qIdx = url.indexOf("?");
  if (qIdx === -1) return {};
  const qs = url.slice(qIdx + 1);
  const out: Record<string, string> = {};
  for (const pair of qs.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const rawK = eq === -1 ? pair : pair.slice(0, eq);
    const rawV = eq === -1 ? "" : pair.slice(eq + 1);
    // Use URLSearchParams for spec-compliant decoding (handles '+' as space
    // and percent-encoding uniformly; throws never, falls back to raw).
    const k = safeDecode(rawK) ?? rawK;
    const v = decodePlusAndPct(rawV);
    out[k] = v;
  }
  return out;
}

/** Decode a query value treating both `+` and `%..` per application/x-www-form-urlencoded. */
function decodePlusAndPct(raw: string): string {
  const dk = safeDecode(raw.replace(/\+/g, " "));
  return dk ?? raw;
}

/**
 * Start the local dashboard server. Resolves once listening. Always binds to
 * loopback by default — the dashboard is for the local user only.
 */
export async function startWebServer(opts: WebServerOptions = {}): Promise<WebServerHandle> {
  const port = opts.port ?? DEFAULT_PORT;
  const host = opts.host ?? DEFAULT_HOST;

  const store = await Store.open(Boolean(opts.here));
  const repo = new PromptRepository(store.raw);

  const server: Server = http.createServer((req, res) => {
    Promise.resolve()
      .then(() => handleRequest(req, res, store, repo))
      .catch((err) => handleError(res, err));
  });

  return new Promise<WebServerHandle>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.removeListener("error", reject);
      server.on("error", (err) => {
        // After listening, surface unhandled errors to console (don't crash).
        if (err != null && process != null) {
          // eslint-disable-next-line no-console
          console.error("[promptstash web] server error:", err);
        }
      });
      const addr = server.address();
      const actualPort =
        typeof addr === "object" && addr !== null ? addr.port : port;
      resolve({
        port: actualPort,
        host,
        close: () =>
          new Promise<void>((res2, rej2) => {
            server.close((e) => (e ? rej2(e) : res2()));
          }),
      });
    });
  });
}

type Req = http.IncomingMessage;
type Res = http.ServerResponse;

function handleRequest(req: Req, res: Res, store: Store, repo: PromptRepository): void {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";
  const pathOnly = url.split("?")[0]!;

  if (method === "GET" && (pathOnly === "/" || pathOnly === "/index.html")) {
    const html = dashboardHtml();
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "content-length": Buffer.byteLength(html),
      "cache-control": "no-store",
    });
    res.end(html);
    return;
  }

  if (method === "GET" && pathOnly === "/api/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (method === "GET" && pathOnly === "/api/info") {
    const versions = store.raw.versions.length;
    json(res, 200, {
      storePath: store.path,
      promptCount: store.raw.prompts.length,
      versionCount: versions,
    });
    return;
  }

  if (method === "GET" && pathOnly === "/api/prompts") {
    json(res, 200, repo.list());
    return;
  }

  // /api/search is registered BEFORE any :name route so a prompt literally
  // named "search" can never shadow it (no name-based special-casing needed).
  if (method === "GET" && pathOnly === "/api/search") {
    const q = parseQuery(url);
    const query = (q.q ?? "").trim();
    if (!query) {
      json(res, 200, []);
      return;
    }
    const semantic = q.semantic === "1" || q.semantic === "true";
    let hits: SearchHit[];
    if (semantic) {
      hits = semanticSearch(store.raw, query);
    } else {
      hits = search(store.raw, query);
    }
    json(res, 200, hits);
    return;
  }

  let params = matchPath("/api/prompts/:name", pathOnly);
  if (method === "GET" && params?.name) {
    try {
      const p = repo.get(params.name);
      json(res, 200, p);
    } catch (err) {
      handleError(res, err);
    }
    return;
  }

  params = matchPath("/api/prompts/:name/versions", pathOnly);
  if (method === "GET" && params?.name) {
    try {
      json(res, 200, repo.versions(params.name));
    } catch (err) {
      handleError(res, err);
    }
    return;
  }

  params = matchPath("/api/prompts/:name/versions/:version", pathOnly);
  if (method === "GET" && params?.name && params?.version) {
    try {
      const n = parseVersionInt(params.version, res);
      if (n === null) return;
      json(res, 200, repo.version(params.name, n));
    } catch (err) {
      handleError(res, err);
    }
    return;
  }

  params = matchPath("/api/prompts/:name/diff/:a/:b", pathOnly);
  if (method === "GET" && params?.name && params?.a && params?.b) {
    try {
      const a = parseVersionInt(params.a, res);
      if (a === null) return;
      const b = parseVersionInt(params.b, res);
      if (b === null) return;
      const va = repo.version(params.name, a);
      const vb = repo.version(params.name, b);
      const d = diffVersions(va, vb);
      // Translate counts into line arrays so the SPA can render actual content.
      json(res, 200, {
        ...d,
        removedLines: extractChangedLines(va.body, vb.body, "removed"),
        addedLines: extractChangedLines(va.body, vb.body, "added"),
        variableChanges: [
          ...d.addedVariables.map((name) => ({ name, type: "added" })),
          ...d.removedVariables.map((name) => ({ name, type: "removed" })),
        ],
      });
    } catch (err) {
      handleError(res, err);
    }
    return;
  }

  notFound(res, "Not found");
}

/**
 * Parse a canonical decimal version number. Returns the integer, or null
 * after sending a 400. Rejects hex/scientific/float forms that `Number()`
 * would otherwise accept (e.g. "0x1", "1e1", "1.0").
 */
function parseVersionInt(raw: string, res: Res): number | null {
  if (!/^\d+$/.test(raw)) {
    badRequest(res, "Invalid version");
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (n < 1) {
    badRequest(res, "Invalid version");
    return null;
  }
  return n;
}

/** Extract the textual content of added/removed lines between two bodies.
 *
 * Mirror jsdiff's multiset semantics so the array length equals the numeric
 * `addedLines`/`removedLines` count returned by `diffVersions`: emit exactly
 * `src - other` copies by incrementing the running deficit one at a time.
 */
function extractChangedLines(bodyA: string, bodyB: string, which: "added" | "removed"): string[] {
  const srcLines = (which === "added" ? bodyB : bodyA).split("\n");
  const otherLines = (which === "added" ? bodyA : bodyB).split("\n");
  const otherCount = new Map<string, number>();
  for (const l of otherLines) otherCount.set(l, (otherCount.get(l) ?? 0) + 1);
  const out: string[] = [];
  for (const line of srcLines) {
    const other = otherCount.get(line) ?? 0;
    if (other > 0) {
      otherCount.set(line, other - 1);
    } else {
      out.push(line);
    }
  }
  return out;
}
