import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { renderBody, extractVariables } from "../../core/prompt.js";
import { execute, listProviderIds } from "../../exec/index.js";
import { readConfig } from "../../config/index.js";
import { readBody } from "../shared.js";
import { c } from "../ui/index.js";

export const execCommand = new Command("exec")
  .description("Run a prompt against an LLM provider")
  .argument("<name>", "Prompt name")
  .option("-p, --provider <id>", `Provider id (one of: ${listProviderIds().join(", ")})`)
  .option("--vars <pairs...>", "Variables as key=value pairs")
  .option("--vars-file <path>", "JSON file with variables")
  .option("-m, --model <id>", "Model id override")
  .option("--system <text>", "System message prefix")
  .option("--stdin", "Read append body from stdin")
  .option("--here", "Use the project-local store")
  .action(
    async (
      name: string,
      opts: {
        provider?: string;
        vars?: string[];
        varsFile?: string;
        model?: string;
        system?: string;
        stdin?: boolean;
        here?: boolean;
      },
    ) => {
      const store = await Store.open(Boolean(opts.here));
      const repo = new PromptRepository(store.raw);
      const prompt = repo.get(name);
      const version = repo.version(name, prompt.currentVersion);

      let vars: Record<string, string> = {};
      if (opts.varsFile) {
        try {
          const raw = await (await import("node:fs/promises")).readFile(opts.varsFile, "utf8");
          const parsed = JSON.parse(raw) as Record<string, string>;
          vars = { ...vars, ...parsed };
        } catch {
          console.error(c.red(`Failed to read or parse vars file: ${opts.varsFile}`));
          process.exitCode = 1;
          return;
        }
      }
      if (opts.vars) {
        for (const pair of opts.vars) {
          const idx = pair.indexOf("=");
          if (idx === -1) { vars[pair] = ""; continue; }
          vars[pair.slice(0, idx)] = pair.slice(idx + 1);
        }
      }
      if (opts.stdin && !process.stdin.isTTY) {
        const extra = await readBody({ stdin: true });
        vars.__stdin = extra;
      }

      const missing = extractVariables(version.body).filter((v) => vars[v] === undefined);
      if (missing.length) {
        console.error(c.red(`Missing variables: ${missing.join(", ")}`));
        process.exitCode = 1;
        return;
      }

      const config = await readConfig();
      const providerId = opts.provider ?? config.defaultProvider ?? "mock";

      try {
        const result = await execute(providerId, {
          prompt: renderBody(version.body, vars),
          system: opts.system,
          model: opts.model,
        });
        console.log(result.text);
        if (process.env.PROMPTSTASH_DEBUG) {
          console.error(c.gray(JSON.stringify(result.meta)));
        }
      } catch (e) {
        console.error(c.red((e as Error).message));
        process.exitCode = 1;
      }
    },
  );
