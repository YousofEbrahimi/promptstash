import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { renderBody } from "../../core/prompt.js";
import { c } from "../ui/index.js";

export const showCommand = new Command("show")
  .description("Show a prompt (latest or specific version)")
  .argument("<name>", "Prompt name")
  .option("-v, --version <number>", "Show a specific version number")
.option("--render <vars...>", "Render with variables as key=value pairs")
  .option("--here", "Use the project-local store")
  .action(
    async (
      name: string,
      opts: { version?: string; render?: string[]; here?: boolean },
    ) => {
      const store = await Store.open(Boolean(opts.here));
      const repo = new PromptRepository(store.raw);
      const prompt = repo.get(name);
      const vn = opts.version ? parseInt(opts.version, 10) : prompt.currentVersion;
      const version = repo.version(name, vn);

      if (opts.render && opts.render.length) {
        const vars: Record<string, string> = {};
        for (const pair of opts.render) {
          const [k, ...rest] = pair.split("=");
          vars[k ?? ""] = rest.join("=");
        }
        console.log(renderBody(version.body, vars));
      } else {
        console.log(c.bold(c.cyan(prompt.name)));
        console.log(c.gray(`v${version.versionNumber} • ${version.createdAt}`));
        if (prompt.tags.length) console.log(c.gray(`tags: ${prompt.tags.join(", ")}`));
        if (version.variables.length) console.log(c.gray(`vars: ${version.variables.join(", ")}`));
        console.log(c.gray(`message: ${version.message}`));
        console.log("");
        console.log(version.body);
      }
    },
  );
