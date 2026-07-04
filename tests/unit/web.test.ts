import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { Store } from "../../src/store/index.js";
import { PromptRepository } from "../../src/store/repository/prompt_repo.js";
import { startWebServer } from "../../src/web/server.js";

const ORIG_HOME = process.env.HOME;
const ORIG_USERPROFILE = process.env.USERPROFILE;

async function fetchJson(baseUrl: string, p: string): Promise<{ status: number; body: unknown; text?: string }> {
  return fetch(`${baseUrl}${p}`).then(async (r) => {
    const ct = r.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) return { status: r.status, body: await r.json() };
    return { status: r.status, body: null, text: await r.text() };
  });
}

function uniqueTmpHome(): string {
  return path.join(os.tmpdir(), `promptstash-web-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

describe("web/server", () => {
  let tmpHome: string;
  let server: { port: number; host: string; close(): Promise<void> };
  let baseUrl: string;

  beforeEach(async () => {
    tmpHome = uniqueTmpHome();
    await fs.mkdir(tmpHome, { recursive: true });
    process.env.HOME = tmpHome;
    process.env.USERPROFILE = tmpHome;

    const store = await Store.init(false);
    const repo = new PromptRepository(store.raw);
    repo.create({
      name: "code-reviewer",
      body: "Review this {{language}} code for bugs.\nFocus on security.",
      description: "Reviews code for bugs",
      tags: ["code", "review"],
      message: "Initial version",
    });
    repo.update("code-reviewer", {
      body: "Review this {{language}} code for {{issueType}} bugs.\nFocus on security and performance.",
      message: "Add issueType variable",
    });
    repo.create({ name: "summarizer", body: "Summarize this {{text}}", tags: ["writing"] });
    await store.persist();

    // Pick a free port by binding to 0.
    server = await startWebServer({ port: 0, host: "127.0.0.1", here: false });
    baseUrl = `http://127.0.0.1:${server.port}`;
  });

  afterEach(async () => {
    await server.close();
    process.env.HOME = ORIG_HOME;
    process.env.USERPROFILE = ORIG_USERPROFILE;
    await fs.rm(tmpHome, { recursive: true, force: true }).catch(() => undefined);
  });

  it("GET /api/health returns ok", async () => {
    const r = await fetchJson(baseUrl, "/api/health");
    expect(r.status).toBe(200);
    expect((r.body as Record<string, unknown>).ok).toBe(true);
  });

  it("GET / returns dashboard HTML", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("promptstash dashboard");
  });

  it("GET /api/info reports counts", async () => {
    const r = await fetchJson(baseUrl, "/api/info");
    expect(r.status).toBe(200);
    const body = r.body as Record<string, unknown>;
    expect(body.promptCount).toBe(2);
    expect(body.versionCount).toBe(3);
    expect(typeof body.storePath).toBe("string");
  });

  it("GET /api/prompts lists all prompts", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts");
    expect(r.status).toBe(200);
    const list = r.body as Array<{ name: string }>;
    expect(list.map((p) => p.name).sort()).toEqual(["code-reviewer", "summarizer"]);
  });

  it("GET /api/prompts/:name returns a single prompt", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts/code-reviewer");
    expect(r.status).toBe(200);
    expect((r.body as Record<string, unknown>).name).toBe("code-reviewer");
  });

  it("GET /api/prompts/:name returns 404 for missing prompt", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts/nope");
    expect(r.status).toBe(404);
  });

  it("GET /api/prompts/:name/versions lists versions ascending", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts/code-reviewer/versions");
    expect(r.status).toBe(200);
    const vs = r.body as Array<{ versionNumber: number }>;
    expect(vs.map((v) => v.versionNumber)).toEqual([1, 2]);
  });

  it("GET /api/prompts/:name/versions/:n returns that version", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts/code-reviewer/versions/2");
    expect(r.status).toBe(200);
    const v = r.body as Record<string, unknown>;
    expect(v.versionNumber).toBe(2);
    expect(String(v.body)).toContain("{{issueType}}");
  });

  it("GET /api/prompts/:name/versions/:n rejects non-integer version", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts/code-reviewer/versions/abc");
    expect(r.status).toBe(400);
  });

  it("GET /api/prompts/:name/diff/:a/:b returns diff with line arrays", async () => {
    const r = await fetchJson(baseUrl, "/api/prompts/code-reviewer/diff/1/2");
    expect(r.status).toBe(200);
    const d = r.body as Record<string, unknown>;
    expect(d.hasChanges).toBe(true);
    expect(Array.isArray(d.addedLines)).toBe(true);
    expect(Array.isArray(d.removedLines)).toBe(true);
    expect(Array.isArray(d.variableChanges)).toBe(true);
  });

  it("GET /api/search?q= finds prompts (lexical)", async () => {
    const r = await fetchJson(baseUrl, "/api/search?q=code");
    expect(r.status).toBe(200);
    const hits = r.body as Array<{ prompt: { name: string } }>;
    expect(hits.some((h) => h.prompt.name === "code-reviewer")).toBe(true);
  });

  it("GET /api/search?semantic=1 returns semantic hits", async () => {
    const r = await fetchJson(baseUrl, "/api/search?q=review%20bugs&semantic=1");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it("GET /api/search with empty query returns []", async () => {
    const r = await fetchJson(baseUrl, "/api/search?q=");
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
  });

  it("unknown route returns 404", async () => {
    const r = await fetchJson(baseUrl, "/api/unknown");
    expect(r.status).toBe(404);
  });
});
