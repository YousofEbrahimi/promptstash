---
layout: home

hero:
  name: "promptstash"
  text: "git for prompts"
  tagline: Version, diff & share your LLM prompts — locally. No account. No lock-in.
  image:
    src: /logo.svg
    alt: promptstash
  actions:
    - theme: brand
      text: Get started
      link: /docs
    - theme: alt
      text: GitHub
      link: https://github.com/promptstash/promptstash

features:
  - title: Versioned prompts
    details: Every edit creates a new immutable version. Roll back to any version instantly. Never lose a good prompt again.
    icon: 🗃️
  - title: Smart diff
    details: See what changed between versions — line-level and variable-level. Added a {{focusArea}}? The diff calls it out.
    icon: 🔍
  - title: Pluggable LLM providers
    details: Execute prompts against OpenAI, Anthropic, Ollama (local), or the built-in mock. No API spend needed to develop.
    icon: 🔌
  - title: Shareable cards
    details: Generate stunning SVG cards from any prompt. Post to Twitter, LinkedIn, or your blog. Built-in viral mechanic.
    icon: 📤
  - title: Local-first & private
    details: Your prompts live in ~/.promptstash/store.json. No account. No telemetry. No vendor lock-in. You own your data.
    icon: 🔒
  - title: CLI + Library
    details: Use from the terminal or import as a Node.js module. Build on top with the Promptstash class API.
    icon: 📦
---
