import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { c } from "../ui/index.js";

export const listCommand = new Command("list")
  .description("List prompts")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-q, --query <text>", "Substring search across name/tags/description")
.option("--json", "Emit JSON instead of a table")
  .option("--here", "Use the project-local store")
  .action(async (opts: { tag?: string; query?: string; json?: boolean; here?: boolean }) => {
    const store = await Store.open(Boolean(opts.here));
    const repo = new PromptRepository(store.raw);
    const prompts = repo.list({ tag: opts.tag, query: opts.query });

    if (opts.json) {
      console.log(JSON.stringify(prompts, null, 2));
      return;
    }

    if (prompts.length === 0) {
      console.log(c.gray("No prompts found. Try `promptstash add <name> --file path/to/prompt.md`."));
      return;
    }

    const rows = prompts.map((p) => ({
      name: p.name,
      version: `v${p.currentVersion}`,
      tags: p.tags.join(","),
      updated: p.updatedAt.slice(0, 10),
    }));

    const nameW = Math.max(4, ...rows.map((r) => r.name.length));
    const tagsW = Math.max(4, ...rows.map((r) => r.tags.length));
    console.log(c.bold(`${"NAME".padEnd(nameW)}  VER  ${"TAGS".padEnd(tagsW)}  UPDATED`));
    for (const r of rows) {
      console.log(
        `${c.cyan(r.name.padEnd(nameW))}  ${r.version}  ${c.gray(r.tags.padEnd(tagsW))}  ${c.gray(r.updated)}`,
      );
    }
    console.log(c.gray(`\n${rows.length} prompt(s)`));
  });
