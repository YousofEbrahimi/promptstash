/**
 * Prompt domain entity.
 *
 * A Prompt is an immutable-named, versioned prompt template. The body may
 * contain Mustache-like variables using double curly-brace syntax ({{name}}).
 *
 * The Prompt holds metadata; the actual body content lives in Version records
 * keyed by `versionNumber`. This separation lets us diff across versions
 * without mutating history.
 */

export interface Prompt {
  /** Unique slug-style identifier (a-z0-9-). */
  id: string;
  /** Human-readable name (same as id in v1). */
  name: string;
  /** Short description shown in `list`. */
  description?: string;
  /** Tags for filtering / grouping. */
  tags: string[];
  /** Declared variables referenced in the body via {{var}}. */
  variables: string[];
  /** Current version number (points to latest Version). */
  currentVersion: number;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

export interface PromptInput {
  name: string;
  description?: string;
  tags?: string[];
  variables?: string[];
}

/**
 * Validate a prompt name: lowercase letters, digits, hyphens. Must start with a letter.
 */
export function validatePromptName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

/**
 * Extract variable placeholders from a prompt body using {{var}} syntax.
 */
export function extractVariables(body: string): string[] {
  const matches = body.matchAll(/{{\s*([\w-]+)\s*}}/g);
  const seen = new Set<string>();
  const vars: string[] = [];
  for (const m of matches) {
    const v = (m[1] ?? "").trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      vars.push(v);
    }
  }
  return vars;
}

/**
 * Render a prompt body with provided variables.
 * Unresolved variables are left as-is (helpful for inspection).
 */
export function renderBody(body: string, vars: Record<string, string | undefined>): string {
  return body.replace(/{{\s*([\w-]+)\s*}}/g, (match, key: string) => {
    const v = vars[key.trim()];
    return v === undefined ? match : String(v);
  });
}
