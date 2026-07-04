import { Command } from "commander";
import { fileURLToPath } from "node:url";
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
import { webCommand } from "./commands/web.js";

const VERSION = "1.1.0";

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
  program.addCommand(webCommand);

  return program;
}

// Run when executed directly (e.g. `node dist/cli.js` or via npm bin shebang).
// Uses fileURLToPath for reliable cross-platform path comparison.
// Wraps detection in a function to avoid top-level await (incompatible with CJS).
function detectDirectExecution(): boolean {
  try {
    const self = fileURLToPath(import.meta.url);
    const argv1 = process.argv[1];
    if (!argv1) return true; // piping mode
    const selfNorm = self.replace(/\\/g, "/");
    const argvNorm = argv1.replace(/\\/g, "/");
    return (
      selfNorm === argvNorm ||
      selfNorm.endsWith(argvNorm) ||
      argvNorm.endsWith(selfNorm)
    );
  } catch {
    return true;
  }
}

if (detectDirectExecution()) {
  buildCli().parse();
}

export default buildCli;
