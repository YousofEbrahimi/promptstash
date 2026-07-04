# Architecture

## Design Goals

1. **Local-first**: All data lives in `~/.promptstash/` or `.promptstash/` — no account, no server, no vendor lock-in.
2. **Zero-dependency install**: Pure JS + TypeScript. `npm install` takes seconds.
3. **Library + CLI dual-use**: The core `Promptstash` class is importable as a Node.js module.
4. **Pluggable ecosystem**: Providers and Publishers are interfaces, not hardcoded choices.

## Data Model

```
StoreData (JSON)
├── Project[]           — isolated namespaces (v1: single "default" project)
├── Prompt[]            — named prompt metadata
├── Version[]           — immutable snapshots (body + variables + message)
└── Tag[]              — named aliases to specific versions
```

- **Immutability**: Version records are never modified. Editing always creates a new version.
- **Referential integrity**: Prompts cascade-delete their versions and tags when removed.

## Store (Persistence)

The store is a single JSON file at `~/.promptstash/store.json` (or `.promptstash/store.json` with `--here`). Writes go to a temp file then `rename()` — atomic even on crash.

Schema migrations run automatically on open if `schemaVersion` is behind `CURRENT_SCHEMA_VERSION`.

## CLI Layers

```
User input (shell)
    ↓
Commander (command/argument parsing)
    ↓
CLI command handler (src/cli/commands/*.ts)
    ↓
Core API (src/index.ts / Promptstash class)
    ↓
Store + Repository (src/store/)
    ↓
Native Node.js APIs (fs, path, os)
```

## Diff Engine

Uses `jsdiff` for line-level unified diffs. Variables (`{{name}}`) are treated as first-class fields — the diff shows `+ {{newVar}}` and `- {{oldVar}}` alongside line changes.

## Share Card

Renders a prompt to a self-contained SVG (no external fonts, no network). The `local` publisher writes `*.svg` + `*.prompt.md` next to the store. Future publishers can upload to gist, R2, or any URL.

## Config

Two-tier: global (`~/.promptstash/config.json`) overridden by project-local (`.promptstash/config.json`). Providers never store secrets — keys come from environment variables resolved at runtime.