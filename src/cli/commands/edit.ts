import { Command } from "commander";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Store } from "../../store/index.js";
import { PromptRepository } from "../../store/repository/prompt_repo.js";
import { serializePrompt, parsePromptDocument } from "../shared.js";
import { c } from "../ui/index.js";

/**
 * Parse an editor string into [command, ...args].
 * Handles both simple names ("vim") and path with args ("code --wait").
 * Validates against shell metacharacters to prevent injection.
 */
function parseEditor(editor: string): string[] {
  if (!editor || !/^[a-zA-Z0-9_./:-]+$/.test(editor)) {
    throw new Error(`Invalid editor: ${editor}`);
  }
  // Split on whitespace but keep the command itself
  return editor.trim().split(/\s+/);
}

/** Sanitize a string for safe use in a file path (no path traversal chars or control chars). */
function safeFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[/\\.]|[\x00-\x1f\x7f]/g, "_");
}

export const editCommand = new Command("edit")
  .description("Open a prompt in $EDITOR; saving creates a new version")
  .argument("<name>", "Prompt name")
  .option("-m, --message <text>", "Version message")
  .option("--here", "Use the project-local store")
  .action(async (name: string, opts: { message?: string; here?: boolean }) => {
    const store = await Store.open(Boolean(opts.here));
    const repo = new PromptRepository(store.raw);
    const prompt = repo.get(name);
    const latest = repo.latestVersion(name);

    const editor = process.env.EDITOR ?? process.env.VISUAL ?? "vi";
    const safeName = safeFileName(prompt.name);
    const tmp = path.join(os.tmpdir(), `promptstash-${safeName}-v${latest.versionNumber}.prompt.md`);
    fs.writeFileSync(tmp, serializePrompt(prompt, latest), "utf8");

    try {
      const [cmd, ...args] = parseEditor(editor);
      spawn(cmd, [...args, tmp], { stdio: "inherit" }).on("error", (err) => {
        throw err;
      });
    } catch {
      fs.unlinkSync(tmp);
      console.error(c.red(`Failed to launch editor "${editor}". Set $EDITOR or $VISUAL.`));
      process.exitCode = 1;
      return;
    }

    const raw = fs.readFileSync(tmp, "utf8");
    fs.unlinkSync(tmp);
    const { body, data } = parsePromptDocument(raw);

    if (body.trim() === latest.body.trim()) {
      console.log(c.gray("No changes — nothing to version."));
      return;
    }

    const message =
      opts.message ??
      (typeof data.message === "string" ? data.message : `Edit ${name}`);
    let tags: string[] | undefined;
    if (Array.isArray(data.tags)) tags = data.tags.map((t) => String(t));
    const { version } = repo.update(name, {
      body,
      message,
      tags,
      description: typeof data.description === "string" ? data.description : undefined,
    });
    await store.persist();
    console.log(c.green(`"${name}" updated to v${version.versionNumber}`));
  });