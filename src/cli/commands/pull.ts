import { Command } from "commander";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { parsePromptDocument, serializePrompt } from "../shared.js";
import { c } from "../ui/index.js";

export const pullCommand = new Command("pull")
  .description("Import a prompt from a .prompt.md file")
  .argument("<file>", "Path to a .prompt.md file")
.option("--force", "Overwrite if a prompt with this name exists")
  .option("--here", "Use the project-local store")
  .action(async (file: string, opts: { force?: boolean; here?: boolean }) => {
    const abs = path.resolve(file);
    const raw = await fs.readFile(abs, "utf8");
    const { body, data } = parsePromptDocument(raw);
    const name = String(data.name ?? path.basename(abs, ".prompt.md"));

    const store = await Store.open(Boolean(opts.here));
    const repo = new PromptRepository(store.raw);
    const tags = Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : undefined;
    const message = typeof data.message === "string" ? data.message : `Imported from ${path.basename(abs)}`;

    const { prompt, version } = repo.create({
      name,
      body,
      description: typeof data.description === "string" ? data.description : undefined,
      tags,
      message,
      force: opts.force,
    });
    await store.persist();
    console.log(c.green(`Imported "${prompt.name}" (v${version.versionNumber})`));
    console.log(c.gray(serializePrompt(prompt, version)));
  });
