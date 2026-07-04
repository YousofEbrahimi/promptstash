# Documentation

## Install

```bash
npm install -g promptstash
```

Or use without installing:

```bash
npx promptstash init
```

## Quick start

```bash
# Initialize your prompt library
promptstash init

# Add a prompt
promptstash add code-reviewer --file ./my-prompt.md

# Edit (opens $EDITOR, creates new version on save)
promptstash edit code-reviewer

# Diff versions
promptstash diff code-reviewer 1 2

# Search
promptstash search "review"

# Execute against an LLM
promptstash exec code-reviewer -p openai --vars language=TypeScript

# Share a card
promptstash share code-reviewer
```

## Commands

See the [README](https://github.com/promptstash/promptstash#commands) for the full command reference.

## Architecture

See [architecture.md](https://github.com/promptstash/promptstash/blob/main/docs/architecture.md).

## Adding providers

See [providers.md](https://github.com/promptstash/promptstash/blob/main/docs/providers.md).

## Contributing

See [CONTRIBUTING.md](https://github.com/promptstash/promptstash/blob/main/CONTRIBUTING.md).
