/**
 * Cross-platform URL opener (no external dependency).
 *
 * Uses the OS's native "open" command via child_process. We avoid the popular
 * `open` npm package to keep the dependency footprint at zero, matching the
 * project's local-first / instant-install philosophy.
 */

import { spawn } from "node:child_process";

/** Open a URL in the user's default browser. No-op on unsupported platforms.
 *
 * The URL is required to be an `http(s)://` loopback URL constructed by the
 * caller (see `src/cli/commands/web.ts`); we additionally reject anything that
 * isn't `^https?://` to defend against cmd.exe metacharacter interpretation on
 * Windows (`cmd /c start "" url` re-parses argv with cmd.exe tokens).
 */
export function openUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!/^https?:\/\/[^\s]+$/.test(url)) {
      resolve();
      return;
    }
    const platform = process.platform;
    let cmd: string;
    let args: string[];
    if (platform === "win32") {
      cmd = "cmd";
      args = ["/c", "start", "", url];
    } else if (platform === "darwin") {
      cmd = "open";
      args = [url];
    } else {
      // Linux / *nix
      cmd = "xdg-open";
      args = [url];
    }
    try {
      const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
      child.on("error", () => resolve());
      child.unref();
      resolve();
    } catch {
      resolve();
    }
  });
}
