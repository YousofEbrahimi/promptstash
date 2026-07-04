import { Command } from "commander";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { Store, resolveStorePath } from "../../store/index.js";
import { c } from "../ui/index.js";

export const initCommand = new Command("init")
  .description("Initialize a new promptstash store")
  .option("--here", "Create the store project-locally (.promptstash) instead of in home")
  .action(async (opts: { here?: boolean }) => {
    const here = Boolean(opts.here);
    const storePath = resolveStorePath(here);
    try {
      await fs.access(storePath);
      console.log(c.yellow(`Store already exists at ${storePath}`));
      return;
    } catch {
      // proceed
    }
    const store = await Store.init(here);
    console.log(c.green("Initialized promptstash store"));
    console.log(c.gray(`  location: ${store.path}`));
    if (here) {
      const scope = path.resolve(process.cwd(), ".promptstash");
      console.log(c.gray(`  tip: add ${scope}/ to .gitignore for personal prompts`));
    } else {
      void os;
      console.log(c.gray("  scope:    global (~/.promptstash)"));
    }
  });

export const closeStore = (s: Store) => {
  void s;
};
