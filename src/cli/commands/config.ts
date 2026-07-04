import { Command } from "commander";
import { readConfig, setConfigValue, globalConfigPath, localConfigPath } from "../../config/index.js";
import { c } from "../ui/index.js";

export const configCommand = new Command("config")
  .description("Read or write configuration");

configCommand
  .command("get <key>")
  .description("Print a config value (dotted key, e.g. defaultProvider)")
  .action(async (key: string) => {
    const config = await readConfig();
    const parts = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = config;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined) break;
    }
    if (cur === undefined) {
      console.log(c.gray(`(unset) ${key}`));
    } else if (typeof cur === "object") {
      console.log(JSON.stringify(cur, null, 2));
    } else {
      console.log(String(cur));
    }
  });

configCommand
  .command("set <key> <value>")
  .description("Write a config value to <scope> (default: global)")
  .option("--scope <scope>", "global | local", "global")
  .action(async (key: string, value: string, opts: { scope: string }) => {
    const scope = opts.scope === "local" ? "local" : "global";
    let parsed: unknown = value;
    if (value === "true") parsed = true;
    else if (value === "false") parsed = false;
    else if (/^-?\d+$/.test(value)) parsed = parseInt(value, 10);
    await setConfigValue(scope, key, parsed);
    console.log(c.green(`Set ${key} = ${value} (${scope})`));
  });

configCommand
  .command("list")
  .description("Print merged config and config file paths")
  .action(async () => {
    const config = await readConfig();
    console.log(c.gray(`global: ${globalConfigPath()}`));
    console.log(c.gray(`local:  ${localConfigPath()}`));
    console.log("");
    console.log(JSON.stringify(config, null, 2));
  });
