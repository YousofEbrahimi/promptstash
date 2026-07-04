# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- towncrier start -->

<!-- towncrier end -->

---

## [1.1.0] — 2026-07-04

### Features

- **web** — Local read-only web dashboard (`promptstash web`). Browses prompts, lexical + semantic search, per-version inspection, and visual diff between versions. Zero-dependency HTTP server (Node `http`) binding to `127.0.0.1` by default; single-page dashboard served at `/`.
- **semantic search (graduated)** — `semanticSearch` now shipped and wired into `promptstash search --semantic` and the web dashboard; toggle via `config set semanticSearch true`.
- **Promptstash.web()** — Programmatic library entry to launch the dashboard over the current store.
- **Dashboard JSON API** — `/api/info`, `/api/prompts`, `/api/prompts/:name[/versions[/:n]]`, `/api/prompts/:name/diff/:a/:b`, `/api/search`, `/api/health`.

### Architecture

- `src/web/server.ts` — zero-dep HTTP server reused by both CLI and library.
- `src/web/dashboard.ts` — self-contained SPA (HTML + CSS + JS) embedded as a string.
- `src/web/opener.ts` — cross-platform `open-url` helper, no external dep.

### Security & robustness

- **Dashboard XSS hardened** — all prompt-sourced content (name, description, tags, version messages, variable names, diff lines) is rendered via `textContent`, never `innerHTML`; the broken `escapeHtml` (entity strings truncated inside the JS template literal) was removed.
- **Loopback enforcement** — `promptstash web --host` now rejects non-loopback hosts (`127.0.0.1` / `localhost` / `::1` only), preventing accidental remote exposure of stored prompts and `storePath`.
- **Error disclosure closed** — server 500 responses return a generic `"Internal error"` instead of raw `err.message` (full errors now logged server-side).
- **Malformed URL handling** — `URIError` from `decodeURIComponent` on bad percent-encoding is caught and surfaced as a `400` rather than a 500.
- **Diff line correctness** — `extractChangedLines` now mirrors jsdiff multiset semantics so `addedLines`/`removedLines` array lengths match the numeric counts in the same response.
- **Version parsing** — diff/version routes accept canonical decimal integers only (rejects `0x1`/`1e1`/`1.0`).
- **`Promptstash.web()` scope** — defaults `here` to the scope the instance was opened with, so `Promptstash.open(true).web()` serves the project-local store instead of silently falling back to the global store.
- **Opener hardening** — `openUrl` rejects non-`http(s)://` URLs to neutralize cmd.exe metacharacter interpretation on Windows.
- **Search caching** — `semanticSearch` caches the corpus IDF + doc vectors until the corpus signature changes, avoiding per-request rebuilds.

---

## [1.0.0] — 2026-07-04

### Features

- **init** — Initialize a new promptstash store (local or global)
- **add** — Create a new prompt with version 1
- **list** — List all prompts with tags, version, and timestamps
- **show** — Show a prompt body (latest or specific version), optionally render variables
- **edit** — Open prompt in `$EDITOR` and create a new version on save
- **diff** — Diff two versions with variable-level and line-level changes
- **tag** — Tag a prompt version (e.g. `stable`, `production`)
- **rm** — Remove a prompt and all its versions
- **search** — Full-text search across prompts (name, tags, description, body)
- **exec** — Execute a prompt against OpenAI / Anthropic / Ollama / Mock
- **share** — Render a shareable SVG card and publish via a publisher
- **pull** — Import a `.prompt.md` file into the store
- **config** — Read/write global or project-local config

### Architecture

- Local-first JSON store (`~/.promptstash/store.json`) — no server, no account
- Immutable version history — every edit creates a new version
- `{{variable}}` syntax with auto-extraction
- Pluggable LLM providers (mock, OpenAI, Anthropic, Ollama)
- Pluggable publishers (local, extensible)
- SVG share cards for social sharing
- Full TypeScript with strict mode
- Comprehensive test suite (unit + e2e)
- CI on Ubuntu, macOS, Windows × Node 20/22