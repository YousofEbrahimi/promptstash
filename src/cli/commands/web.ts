import { Command } from "commander";
import { startWebServer } from "../../web/server.js";
import { c } from "../ui/index.js";

/** Loopback-only hostnames. The dashboard is intentionally local; binding
 *  remotely would expose stored prompt bodies and the store filesystem path. */
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export const webCommand = new Command("web")
  .description("Launch a local web dashboard (read-only) over your prompts")
  .option("-p, --port <port>", "TCP port (0 = random free port, default: 6363)", "6363")
  .option("-H, --host <host>", "Loopback bind address (default: 127.0.0.1)", "127.0.0.1")
  .option("--here", "Use the project-local store")
  .action(async (opts: { port: string; host: string; here?: boolean }) => {
    const port = Number(opts.port);
    const host = opts.host;
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      console.log(c.red(`Invalid port: ${opts.port}`));
      process.exitCode = 1;
      return;
    }
    if (!LOOPBACK_HOSTS.has(host)) {
      console.log(c.red(`Invalid host: "${host}". For safety the dashboard binds to loopback only (127.0.0.1 | localhost | ::1).`));
      process.exitCode = 1;
      return;
    }

    try {
      const handle = await startWebServer({ port, host, here: Boolean(opts.here) });
      const url = `http://${host}:${handle.port}`;
      console.log(c.bold("promptstash web dashboard"));
      console.log(c.green("  ✓ ") + `listening on ${c.cyan(url)}`);
      console.log(c.gray("  • read-only • loopback only • Ctrl-C to stop"));

      const opener = await import("../../web/opener.js").catch(() => null);
      if (opener) await opener.openUrl(url);

      const shutdown = () => {
        handle.close().finally(() => process.exit(0));
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("store") || message.includes("init")) {
        console.log(c.red(`No store found. Run \`promptstash init\` first.`));
      } else {
        console.log(c.red(`Failed to start web server: ${message}`));
      }
      process.exitCode = 1;
    }
  });
