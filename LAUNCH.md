# Launch Strategy & Marketing Assets

## Tagline

> **promptstash — git for prompts. Version, diff & share your LLM prompts, locally.**

## Launch venues

Primary (high-signal developer audiences):

- **Hacker News** (Show HN) — Tuesday or Wednesday, 8am PT
- **Reddit** — r/programming, r/MachineLearning, r/LocalLLaMA, r/programmingtools, r/prompts
- **X / Twitter** — thread + GIF
- **Product Hunt** — full launch with maker comment
- **Dev.to / dev.to** — technical deep-dive blog post
- **Hacker Noon** — opinion piece on why prompts need version control
- **Discord communities** — OpenAI, Anthropic, LangChain, r/LocalLLaMA Discord

Secondary:

- **LinkedIn** — short post + share card
- **YouTube short** — 30-sec CLI demo
- **DEV Discord** — share in dev-tool channels
- **GitHub Trending** — natural if HN/Reddit hit

## GitHub Topics (for SEO)

`prompts`, `prompt-engineering`, `prompt-management`, `llm`, `ai`, `cli`, `developer-tools`, `version-control`, `local-first`, `openai`, `anthropic`, `ollama`, `typescript`, `prompt-library`, `prompt-versioning`

## SEO Description (for GitHub repo description field)

"git for prompts — version, diff & share your LLM prompts, locally. Local-first CLI for prompt engineering with OpenAI/Anthropic/Ollama support."

## Social media copy

### X / Twitter — Thread

> **Post 1 (hook)**
>
> I open-sourced `git for prompts`.
>
> Stop losing your best AI prompts across 50 ChatGPT tabs.
>
> promptstash: version, diff & share your LLM prompts — locally.
>
> 🔗 github.com/promptstash/pro…
>
> 🧵 1/6

> **Post 2 (demo)**
>
> What if you could:
>
> ✅ Add a prompt → `promptstash add code-reviewer`
> ✅ Edit → `promptstash edit` (creates v2, immutable)
> ✅ Diff → `promptstash diff code-reviewer 1 2`
> ✅ Tag → `promptstash tag code-reviewer stable`
> ✅ Search → `promptstash search "review"`
>
> See variables like `{{language}}` tracked first-class. 2/6

> **Post 3 (exec)**
>
> Run any prompt against OpenAI, Anthropic, Ollama (local), or a mock provider — no API spend needed to develop.
>
> `promptstash exec code-reviewer -p openai --vars language=TypeScript`
>
> 3/6

> **Post 4 (share)**
>
> `promptstash share code-reviewer` generates a beautiful SVG card you can post here.
>
> Built-in viral mechanic. 4/6

> **Post 5 (local-first)**
>
> Your prompts live in `~/.promptstash/store.json`. No account. No telemetry. No vendor lock-in.
>
> Also importable as a Node.js library:
>
> `import { Promptstash } from "promptstash"` 5/6

> **Post 6 (CTA)**
>
> ⭐ Star it: github.com/promptstash/pro…
> 📦 Install: `npm install -g promptstash`
> 🤝 We welcome PRs — adding a provider or publisher is a 20-line file. 6/6

### Reddit — r/programming (text post title)

> **Show HN-style title**: I open-sourced "git for prompts" — version, diff & share your LLM prompts locally

> **Body**:
>
> I kept losing great prompts in ChatGPT. I'd tweak a prompt, get a great result, accidentally close the tab, and never reproduce it again.
>
> So I built promptstash — `git` for your prompts:
>
> - **add** prompts with auto-extracted `{{variables}}`
> - **edit** in your `$EDITOR` — every save creates a new immutable version
> - **diff** between versions (line-level + variable-level)
> - **tag** versions (e.g. `stable`, `production`)
> - **search** full-text across your library
> - **exec** against OpenAI/Anthropic/Ollama/mock
> - **share** generates a beautiful SVG card for Twitter
>
> It's local-first (no account, no cloud, no lock-in), TypeScript, MIT, and has a pluggable ecosystem for adding new providers/publishers.
>
> One command install: `npm install -g promptstash`
>
> Repo: https://github.com/YousofEbrahimi/promptstash
>
> Looking for contributors — adding a provider is literally 20 lines. See CONTRIBUTING.md.

### Hacker News — Show HN

> **Title**: Show HN: promptstash – git for prompts, version/diff/share your LLM prompts locally
>
> **Text**:
>
> Hi HN, I kept losing good ChatGPT prompts to tab entropy. So I built a CLI that treats prompts like git treats code:
>
> - Every edit creates a new immutable version (`promptstash edit` opens `$EDITOR`, save → v2)
> - `promptstash diff` shows what changed between versions — including added/removed `{{variables}}`
> - `promptstash share` renders a pretty SVG card you can post to Twitter
> - Local-first: prompts live in `~/.promptstash/store.json`, no account, no cloud
> - Pluggable providers (OpenAI/Anthropic/Ollama/mock) and publishers (local/gist)
>
> It's a Node CLI + importable library in TypeScript. Zero native deps so `npm install` is instant on Windows/Mac/Linux.
>
> Repo: https://github.com/YousofEbrahimi/promptstash
>
> Install: `npm i -g promptstash` or `npx promptstash`
>
> Looking for first contributors — adding a new LLM provider or share publisher is a great "good first issue" (see CONTRIBUTING.md).

### Product Hunt

> **Tagline**: Version, diff & share your AI prompts — locally
>
> **Description**:
>
> promptstash is the first local-first version control system for LLM prompts. Think `git`, but for your prompts.
>
> Stop losing your best prompts across ChatGPT tabs. promptstash lets you add, version, diff, tag, search, execute, and share your prompts — all stored locally in a single JSON file. No account. No cloud. No vendor lock-in.
>
> Features:
> - Immutable version history (every edit creates a new version)
> - Smart diff (line-level + variable-level, `{{var}}` tracked)
> - Execute against OpenAI, Anthropic, Ollama, or a mock provider
> - Generate stunning SVG share cards for social media
> - Pluggable ecosystem for providers and publishers
> - Dual-use: CLI + importable Node.js library
>
> `npm install -g promptstash`

### LinkedIn — short post

> I open-sourced a tool I wish I had a year ago: **git for prompts**.
>
> Every AI engineer loses great prompts to ChatGPT tabs. You tweak a prompt, it works, you close the tab, it's gone forever.
>
> promptstash fixes that: version, diff, tag, search, execute, and share your LLM prompts — all locally.
>
> ⭐ github.com/YousofEbrahimi/promptstash
> 📦 `npm install -g promptstash`
>
> Looking for early adopters and contributors. Adding a new LLM provider is a 20-line file — great first PR.

## Strategy: First 1,000 stars

1. **Ship the README first.** GIF-heavy, comparison table, 10-second demo. This is your landing page.
2. **Launch on HN (Show HN) Tuesday/Wednesday 8am PT.** Write a personal, sincere post. Respond to every comment within 5 minutes for the first 2 hours.
3. **Tweet thread** with a 30-second GIF. Tag @OpenAI, @AnthropicAI, @LangChainAI. Quote-tweet your own thread to add context.
4. **Cross-post to Reddit** — r/programming, r/MachineLearning, r/LocalLLaMA, r/prompts. Adapt the title for each sub's culture (r/LocalLLaMA loves the Ollama integration; r/programming loves the git analogy).
5. **Seed in 3-5 Discords** — OpenAI, Anthropic, LangChain, r/LocalLLaMA. Don't spam — share a specific value-add ("I just open-sourced a local prompt versioning tool, Ollama works out of the box").
6. **Good first issues** — label 5+ issues `good first issue`. "Add Cohere provider", "Add Pastebin publisher", "Add FA translation of README". Contributors attract contributors.
7. **Blog post** — "Why I built git for prompts" on dev.to. Cross-link to HN and Reddit.
8. **GitHub Trending** — if HN/Reddit hit, this happens naturally. Ensure topics, description, and social preview image are set.
9. **Influencer outreach** — DM 5-10 dev tool Twitter accounts. Offer to help with their prompt workflow in exchange for a tweet.
10. **Press** — submit to Hacker Noon, TLDR newsletter, JavaScript Weekly.

## Strategy: 10,000 stars

1. **Prompt marketplace** — `promptstash pull <share-id>` imports community-shared prompts. Network effect: more users → more shared prompts → more users.
2. **Integrations** — LangChain adapter, continue.dev integration, a400mr/Yank hacking suggestions.
3. **Weekly "Prompt of the Week"** — feature the best community-shared prompt. Cross-post to Twitter/HN. Drives repeat engagement.
4. **VS Code extension** — visual diff viewer, inline editing, sidebar of tags. Reduces friction for non-CLI users.
5. **Conference talks** — propose "Version Control for Prompts" to AI Engineer Summit, JSConf, Nodeconf. Slides → repo stars.
6. **Translated docs** — FA, ES, ZH, FR, DE. Each translation reaches a new regional community. Tag contributors in release notes.
7. **Team features (v2)** — self-hosted sync, eval harness, datasets. Unlocks enterprise adoption — larger orgs star repos their teams depend on.
8. **Awesome list** — curate `awesome-promptstash` with community prompts, integrations, and tutorials. Link from README.
9. **Video content** — short YouTube tutorials ("5 promptstash workflows"). Embed in README.
10. **Stewardship** — respond to every issue within 24h for the first 3 months. Fast maintainer response is the #1 driver of OSS trust and stars.

## Contributor hook features

Features designed to make the project attractive for contributions:

1. **Pluggable `Provider` interface** — adding OpenRouter, Cohere, Mistral, Groq, Together is a 20-line file in `src/exec/providers/`. Documented in `docs/providers.md`.
2. **Pluggable `Publisher` interface** — adding Pastebin, GitHub Gist, Cloudflare R2, S3 is a factory registration. Good first PR.
3. **`good first issue` labels** — pre-filed issues with clear scope (add a provider, add a publisher, translate README, improve search ranking).
4. **Clear architecture docs** — `docs/architecture.md` explains each layer. New contributors don't need to read the whole codebase.
5. **Comprehensive test suite** — contributors can verify their changes with `npm test`. Mock provider means no API spend for testing.
6. **Conventional commits + release-please** — contributors don't need to manage versions; the bot handles it.
7. **Issue templates** — bug report, feature request, and config for Discussions + Discord link.
8. **Dual-use library** — contributors can build on top of promptstash (VS Code extension, web UI) without forking the core.