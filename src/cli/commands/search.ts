import { Command } from "commander";
import { Store } from "../../store/index.js";
import { search, semanticSearch } from "../../search/index.js";
import { readConfig } from "../../config/index.js";
import { c } from "../ui/index.js";

export const searchCommand = new Command("search")
  .description("Search your prompts")
  .argument("<query>", "Search query")
  .option("--semantic", "Use semantic search (experimental, requires config)")
  .option("--here", "Use the project-local store")
  .action(async (query: string, opts: { semantic?: boolean; here?: boolean }) => {
    const store = await Store.open(Boolean(opts.here));
    let hits;
    if (opts.semantic) {
      const config = await readConfig();
      if (!config.semanticSearch) {
        console.log(c.yellow("Semantic search is not enabled. Run: promptstash config set semanticSearch true"));
        return;
      }
      hits = semanticSearch(store.raw, query);
    } else {
      hits = search(store.raw, query);
    }
    if (hits.length === 0) {
      console.log(c.gray(`No prompts matched "${query}".`));
      return;
    }
    console.log(c.bold(`Results for "${query}"${opts.semantic ? " (semantic)" : ""}:\n`));
    for (const h of hits) {
      console.log(`${c.cyan(h.prompt.name)} ${c.gray(`(score ${h.score}, ${h.matchedFields.join("+")})`)}`);
      if (h.prompt.description) console.log(`  ${h.prompt.description}`);
    }
  });
