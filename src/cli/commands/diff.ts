import { Command } from "commander";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { diffVersions } from "../../diff/prompt-diff.js";
import { c } from "../ui/index.js";

export const diffCommand = new Command("diff")
  .description("Diff two versions of a prompt")
  .argument("<name>", "Prompt name")
.argument("<v1>", "First version number")
  .argument("[v2]", "Second version number (default: latest)")
  .option("--here", "Use the project-local store")
  .action(async (name: string, v1str: string, v2str?: string, opts?: { here?: boolean }) => {
    const store = await Store.open(Boolean(opts?.here));
    const repo = new PromptRepository(store.raw);
    const v1n = parseInt(v1str, 10);
    if (!Number.isInteger(v1n) || v1n < 1) {
      console.error(c.red(`Invalid version number: ${v1str}`));
      process.exitCode = 1;
      return;
    }
    const v1 = repo.version(name, v1n);
    const prompt = repo.get(name);
    const v2n = v2str ? parseInt(v2str, 10) : prompt.currentVersion;
    if (v2str && (!Number.isInteger(v2n) || v2n < 1)) {
      console.error(c.red(`Invalid version number: ${v2str}`));
      process.exitCode = 1;
      return;
    }
    const v2 = repo.version(name, v2n);
    const result = diffVersions(v1, v2);

    if (!result.hasChanges) {
      console.log(c.gray(`No changes between v${v1.versionNumber} and v${v2.versionNumber}.`));
      return;
    }

    if (result.addedVariables.length || result.removedVariables.length) {
      console.log(c.bold("Variables:"));
      for (const a of result.addedVariables) console.log(c.green(`  + {{${a}}}`));
      for (const rm of result.removedVariables) console.log(c.red(`  - {{${rm}}}`));
      console.log("");
    }
    console.log(c.gray(`${result.addedLines} added, ${result.removedLines} removed`));
    console.log("");
    console.log(result.unified);
  });
