import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { c } from "../ui/index.js";

export const rmCommand = new Command("rm")
  .description("Remove a prompt and all its versions")
  .argument("<name>", "Prompt name")
.option("-f, --force", "Skip interactive confirmation")
  .option("--here", "Use the project-local store")
  .action(async (name: string, opts: { force?: boolean; here?: boolean }) => {
    const store = await Store.open(Boolean(opts.here));
    const repo = new PromptRepository(store.raw);
    repo.get(name);
    if (!opts.force && process.stdin.isTTY) {
      console.log(c.yellow(`About to delete "${name}" and all its versions.`));
      console.log(c.gray("Re-run with --force to confirm."));
      return;
    }
    repo.remove(name);
    await store.persist();
    console.log(c.green(`Removed "${name}".`));
  });
