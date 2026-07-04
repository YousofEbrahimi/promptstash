# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- towncrier start -->

<!-- towncrier end -->

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