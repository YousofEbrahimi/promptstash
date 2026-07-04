# Contributing to promptstash

Welcome! promptstash is a community-driven project. Here's how to get started.

## Development setup

```bash
git clone https://github.com/YousofEbrahimi/promptstash.git
cd promptstash
npm install
npm run build     # compile TypeScript
npm test          # run tests
npm run lint      # lint
```

## Architecture

The codebase is organized into clear layers:

```
src/
  cli/          — Commander-based CLI commands (commands/, ui/)
  core/         — Domain entities (Prompt, Version, Tag, errors)
  store/        — JSON file persistence (schema, repository pattern)
  diff/         — Version diffing (jsdiff + variable tracking)
  exec/         — LLM provider abstraction + OpenAI/Anthropic/Ollama adapters
  render/       — SVG card rendering for sharing
  publish/      — Pluggable publishers (local, gist)
  search/       — Lexical full-text search (+ semantic stub)
  config/       — Two-tier rc config (global + project-local)
```

The `src/index.ts` exports the `Promptstash` class as a library — you can import it directly:

```ts
import { Promptstash } from "promptstash";
const ps = await Promptstash.open();
await ps.add("my-prompt", "Hello {{name}}");
const diff = await ps.diff("my-prompt", 1, 2);
```

## Adding a new provider

1. Create `src/exec/providers/myprovider.ts` implementing the `Provider` interface.
2. Register it in `src/exec/index.ts` via `providers.set("myprovider", () => new MyProvider())`.
3. Add `MYPROVIDER_API_KEY` to the env-check pattern.
4. Add tests.

## Adding a new publisher

1. Create `src/publish/my-publisher.ts` implementing the `Publisher` interface.
2. Register in `src/publish/index.ts` via `registerPublisher("my-publisher", factory)`.
3. Add tests.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:    new feature
fix:     bug fix
docs:    documentation
refactor: code restructure (no feature/bug change)
perf:    performance improvement
test:    adding/updating tests
build:   build system changes
ci:      CI/CD changes
chore:   maintenance
```

Commits are enforced via `@commitlint/config-conventional` on merge to main.

## Code style

- 2-space indent, single quotes, trailing commas.
- Run `npm run format` before committing.
- Strict TypeScript (`strictNullChecks`, `noImplicitAny`).
- No `any` without a comment explaining why.

## Reporting issues

Use the [Bug Report](./.github/ISSUE_TEMPLATE/bug_report.yml) or [Feature Request](./.github/ISSUE_TEMPLATE/feature_request.yml) templates.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.