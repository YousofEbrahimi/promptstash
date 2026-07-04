/**
 * UI helpers for the CLI: styled output via chalk and a lightweight spinner.
 * We avoid `ora` to keep deps minimal; a simple async spinner is sufficient.
 */

import chalk from "chalk";

export const c = {
  bold: chalk.bold,
  dim: chalk.dim,
  green: chalk.green,
  red: chalk.red,
  yellow: chalk.yellow,
  cyan: chalk.cyan,
  magenta: chalk.magenta,
  gray: chalk.gray,
  underline: chalk.underline,
  bg: {
    indigo: (s: string) => chalk.bgHex("#6366f1").white.bold(s),
  },
};

export interface Spinner {
  start(msg: string): void;
  stop(msg?: string, ok?: boolean): void;
  fail(msg: string): void;
}

export function createSpinner(stream: NodeJS.WriteStream = process.stderr): Spinner {
  let timer: NodeJS.Timeout | null = null;
  let current = "";
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  function render() {
    stream.write(`\r${c.gray(frames[i % frames.length] ?? "•")} ${current}`);
    i++;
  }

  return {
    start(msg: string) {
      current = msg;
      timer = setInterval(render, 80);
    },
    stop(msg, ok = true) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      stream.write("\r\x1b[K");
      if (msg) {
        stream.write(`${ok ? c.green("✓") : c.red("✗")} ${msg}\n`);
      }
    },
    fail(msg: string) {
      this.stop(msg, false);
    },
  };
}
