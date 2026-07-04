import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { PromptExistsError, InvalidPromptNameError } from "../../core/errors.js";
import { readBody } from "../shared.js";
import { c } from "../ui/index.js";

export const addCommand = new Command("add")
  .description("Create a new prompt (version 1)")
  .argument("<name>", "Unique prompt name (a-z0-9-)")
  .option("-f, --file <path>", "Read prompt body from a file")
  .option("-d, --description <text>", "Short description")
  .option("-t, --tag <tags...>", "Tags (space-separated)")
  .option("-m, --message <text>", "Initial version message")
  .option("--stdin", "Read body from stdin")
  .option("--force", "Overwrite/update if a prompt with this name exists")
  .option("--here", "Use the project-local store")
  .action(
    async (
      name: string,
      opts: {
        file?: string;
        stdin?: boolean;
        description?: string;
        tag?: string[];
        message?: string;
        force?: boolean;
        here?: boolean;
      },
    ) => {
      const body = await readBody(opts);
      const store = await Store.open(Boolean(opts.here));
      const repo = new PromptRepository(store.raw);
      try {
        const { prompt, version } = repo.create({
          name,
          body,
          description: opts.description,
          tags: opts.tag,
          message: opts.message ?? "Initial version",
          force: opts.force,
        });
        await store.persist();
        console.log(c.green(`Added "${prompt.name}" (v${version.versionNumber})`));
        console.log(c.gray(`  variables: ${version.variables.length ? version.variables.join(", ") : "(none)"}`));
        console.log(c.gray(`  tags:      ${prompt.tags.length ? prompt.tags.join(", ") : "(none)"}`));
      } catch (e) {
        handleAddError(e, name);
      }
    },
  );

function handleAddError(e: unknown, name: string): never {
  if (e instanceof PromptExistsError) {
    console.error(c.red(e.message));
    process.exitCode = 1;
  } else if (e instanceof InvalidPromptNameError) {
    console.error(c.red(e.message), name);
    process.exitCode = 1;
  } else {
    throw e as Error;
  }
  process.exit(process.exitCode || 1);
}
