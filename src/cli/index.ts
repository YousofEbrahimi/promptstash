import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";
import { editCommand } from "./commands/edit.js";
import { diffCommand } from "./commands/diff.js";
import { tagCommand } from "./commands/tag.js";
import { rmCommand } from "./commands/rm.js";
import { searchCommand } from "./commands/search.js";
import { execCommand } from "./commands/exec.js";
import { shareCommand } from "./commands/share.js";
import { pullCommand } from "./commands/pull.js";
import { configCommand } from "./commands/config.js";

const VERSION = "1.0.0";

export function buildCli(): Command {
  const program = new Command();

  program
    .name("promptstash")
    .version(VERSION)
    .description("git for prompts — version, diff and share your LLM prompts, locally.");

  program.addCommand(initCommand);
  program.addCommand(addCommand);
  program.addCommand(listCommand);
  program.addCommand(showCommand);
  program.addCommand(editCommand);
  program.addCommand(diffCommand);
  program.addCommand(tagCommand);
  program.addCommand(rmCommand);
  program.addCommand(searchCommand);
  program.addCommand(execCommand);
  program.addCommand(shareCommand);
  program.addCommand(pullCommand);
  program.addCommand(configCommand);

  return program;
}

// Run when executed directly (e.g. `node dist/cli.js` or via npm bin shebang).
// Uses fileURLToPath for reliable cross-platform path comparison.
try {
  const { fileURLToPath } = await import("node:url");
  const self = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1];
  if (!argv1) {
    // piping mode — still run the CLI (commander handles stdin)
  } else {
    // Normalize paths for comparison (handle Windows vs POSIX separators)
    const selfNorm = self.replace(/\\/g, "/");
    const argvNorm = argv1.replace(/\\/g, "/");
    if (selfNorm.endsWith(argvNorm) || argvNorm.endsWith(selfNorm) || selfNorm === argvNorm) {
      buildCli().parse();
    }
  }
} catch {
  // If fileURLToPath fails, run anyway — idempotent for CLI.
  buildCli().parse();
}

export default buildCli;
