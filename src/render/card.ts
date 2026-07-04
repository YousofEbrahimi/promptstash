/**
 * Card renderer — produces a self-contained SVG image of a prompt suitable
 * for sharing on social media.
 *
 * We hand-roll a minimal SVG to avoid heavy syntax-highlighting deps in the
 * default install path. The SVG is dark-themed (matches developer tooling
 * aesthetics) and embeds the prompt body monospaced with line wrapping.
 *
 * Decisions:
 *  - No external fonts (system monospace stack) so output is portable.
 *  - Width 1200 × height dynamic, sized to body length (social card friendly).
 *  - Escapes XML-significant characters to prevent malformed SVG.
 */

import type { Prompt } from "../core/prompt.js";
import type { Version } from "../core/version.js";

export interface RenderCardOptions {
  /** Highlight color accent (default indigo). */
  accent?: string;
  /** Max body characters; remainder truncated with ellipsis. */
  maxChars?: number;
}

const AMP = String.fromCharCode(38); // &
const LT = String.fromCharCode(60); // <
const GT = String.fromCharCode(62); // >
const QUOT = String.fromCharCode(34); // "
const APOS = String.fromCharCode(39); // '

const XML_ENTITIES: Record<string, string> = {
  [AMP]: `${AMP}amp;`,
  [LT]: `${AMP}lt;`,
  [GT]: `${AMP}gt;`,
  [QUOT]: `${AMP}quot;`,
  [APOS]: `${AMP}apos;`,
};

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ENTITIES[c] ?? c);
}

/** Validate and normalize a hex accent color. Defaults to indigo if invalid. */
export function validateAccent(raw: string | undefined): string {
  if (raw && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  return "#6366f1"; // default indigo
}

/** Naive word-wrap to a max line length (chars at 11px monospace fit ~95 chars in 1120px). */
function wrap(text: string, maxLine = 92): string[] {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    if (raw.length <= maxLine) {
      lines.push(raw);
      continue;
    }
    let acc = "";
    for (const word of raw.split(" ")) {
      if (acc.length + word.length + 1 > maxLine) {
        lines.push(acc);
        acc = word;
      } else {
        acc = acc ? `${acc} ${word}` : word;
      }
    }
    if (acc) lines.push(acc);
  }
  return lines;
}

export function renderCard(
  prompt: Prompt,
  version: Version,
  opts: RenderCardOptions = {},
): string {
  const accent = validateAccent(opts.accent);
  const max = opts.maxChars ?? 1400;
  const body = version.body.length > max ? `${version.body.slice(0, max)}…` : version.body;
  const lines = wrap(body);
  const lineHeight = 20;
  const padding = 48;
  const titleHeight = 80;
  const bodyHeight = Math.max(lineHeight * lines.length + padding, 200);
  const width = 1200;
  const height = titleHeight + bodyHeight + padding;

  const linesXml = lines
    .map(
      (l, i) =>
        `<text x="${padding}" y="${titleHeight + padding + i * lineHeight}" class="code">${escapeXml(l)}</text>`,
    )
    .join("\n");

  const tags = prompt.tags.length
    ? prompt.tags.map((t) => `<tspan class="tag">#${escapeXml(t)} </tspan>`).join("")
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#0f172a"/>
  <rect x="0" y="0" width="${width}" height="6" fill="${accent}"/>
  <text x="${padding}" y="44" class="title">${escapeXml(prompt.name)}</text>
  <text x="${padding}" y="68" class="meta">${tags}• v${version.versionNumber} • promptstash</text>
  <rect x="${padding - 12}" y="${titleHeight}" width="${width - 2 * padding + 24}" height="${bodyHeight + 24}" fill="#1e293b" rx="12"/>
  ${linesXml}
  <style>
    .title { fill: #f8fafc; font: 700 28px -apple-system, Segoe UI, Roboto, sans-serif; }
    .meta { fill: #94a3b8; font: 500 14px -apple-system, Segoe UI, Roboto, sans-serif; }
    .tag { fill: ${accent}; font: 600 14px -apple-system, Segoe UI, Roboto, sans-serif; }
    .code { fill: #e2e8f0; font: 400 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</svg>`;
}
