/**
 * Typed errors for promptstash.
 *
 * Each error class carries a stable `code` so the CLI and library consumers
 * can branch on failure modes programmatically without fragile string matching.
 */

export type ErrorCode =
  | "PROMPT_NOT_FOUND"
  | "PROMPT_EXISTS"
  | "VERSION_NOT_FOUND"
  | "TAG_EXISTS"
  | "NOT_INITIALIZED"
  | "ALREADY_INITIALIZED"
  | "INVALID_PROMPT_NAME"
  | "INVALID_VERSION"
  | "PROVIDER_NOT_CONFIGURED"
  | "PUBLISHER_NOT_CONFIGURED"
  | "STORE_ERROR"
  | "CONFIG_ERROR";

export class PromptstashError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
    // Maintain proper stack trace in V8 engines
    if ("captureStackTrace" in Error) {
      (Error as unknown as { captureStackTrace: (t: object, s: unknown) => void }).captureStackTrace(
        this,
        this.constructor,
      );
    }
  }
}

export class PromptNotFoundError extends PromptstashError {
  constructor(name: string) {
    super("PROMPT_NOT_FOUND", `Prompt "${name}" not found.`);
  }
}

export class PromptExistsError extends PromptstashError {
  constructor(name: string) {
    super("PROMPT_EXISTS", `Prompt "${name}" already exists. Use --force to overwrite.`);
  }
}

export class VersionNotFoundError extends PromptstashError {
  constructor(name: string, version: number) {
    super("VERSION_NOT_FOUND", `Version ${version} of "${name}" not found.`);
  }
}

export class NotInitializedError extends PromptstashError {
  constructor(path?: string) {
    super(
      "NOT_INITIALIZED",
      `No promptstash store found${path ? ` at ${path}` : ""}. Run \`promptstash init\` first.`,
    );
  }
}

export class AlreadyInitializedError extends PromptstashError {
  constructor(path: string) {
    super("ALREADY_INITIALIZED", `promptstash already initialized at ${path}.`);
  }
}

export class InvalidPromptNameError extends PromptstashError {
  constructor(name: string) {
    super(
      "INVALID_PROMPT_NAME",
      `Invalid prompt name "${name}". Use only lowercase letters, numbers, and hyphens (a-z0-9-).`,
    );
  }
}

export class ProviderNotConfiguredError extends PromptstashError {
  constructor(provider: string) {
    super(
      "PROVIDER_NOT_CONFIGURED",
      `Provider "${provider}" is not configured. Set the required API key or configure it with \`promptstash config set\`.`,
    );
  }
}

export class StoreError extends PromptstashError {
  constructor(message: string, options?: ErrorOptions) {
    super("STORE_ERROR", message, options);
  }
}
