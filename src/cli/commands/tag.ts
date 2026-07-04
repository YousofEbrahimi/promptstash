import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { c } from "../ui/index.js";

export const tagCommand = new Command("tag")
  .description("Add or remove a tag on a prompt")
  .argument("<name>", "Prompt name")
  .argument("<tag>", "Tag name (a-z0-9-)")
  .option("--remove", "Remove the tag instead of adding it")
.option("-v, --version <number>", "Pin tag to a specific version (add)")
  .option("--here", "Use the project-local store")
  .action(async (name: string, tag: string, opts: { remove?: boolean; version?: string; here?: boolean }) => {
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) {
      console.error(c.red(`Invalid tag name "${tag}". Use lowercase letters, numbers and hyphens (a-z0-9-).`));
      process.exitCode = 1;
      return;
    }
    const store = await Store.open(Boolean(opts.here));
    const repo = new PromptRepository(store.raw);
    if (opts.remove) {
      repo.removeTag(name, tag);
      await store.persist();
      console.log(c.gray(`Removed tag "${tag}" from "${name}".`));
      return;
    }
    repo.setTag(name, tag, opts.version ? parseInt(opts.version, 10) : undefined);
    await store.persist();
    console.log(c.green(`Tagged "${name}" with "${tag}".`));
  });
