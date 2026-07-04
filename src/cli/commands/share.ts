import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { renderCard } from "../../render/card.js";
import { getPublisher, listPublisherIds } from "../../publish/index.js";
import { readConfig } from "../../config/index.js";
import { serializePrompt } from "../shared.js";
import { c } from "../ui/index.js";

export const shareCommand = new Command("share")
  .description("Render and publish a shareable prompt card")
  .argument("<name>", "Prompt name")
  .option("-v, --version <number>", "Share a specific version")
.option("-p, --publisher <id>", `Publisher id (one of: ${listPublisherIds().join(", ")})`)
  .option("--accent <color>", "Hex accent color for the card (e.g. #6366f1)")
  .option("--here", "Use the project-local store")
  .action(async (name: string, opts: { version?: string; publisher?: string; accent?: string; here?: boolean }) => {
    const store = await Store.open(Boolean(opts.here));
    const repo = new PromptRepository(store.raw);
    const prompt = repo.get(name);
    const vn = opts.version ? parseInt(opts.version, 10) : prompt.currentVersion;
    const version = repo.version(name, vn);

    const card = renderCard(prompt, version, { accent: opts.accent });
    const config = await readConfig();
    const publisherId = opts.publisher ?? config.defaultPublisher ?? "local";
    const publisher = getPublisher(publisherId, (config.publishers?.[publisherId] as Record<string, unknown>) ?? {});

    const result = await publisher.publish({
      prompt,
      version,
      card,
      body: serializePrompt(prompt, version),
    });

    console.log(c.green(`Shared "${name}" (${result.label})`));
    console.log(c.gray(`  ${result.url}`));
  });
