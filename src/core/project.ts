/**
 * Project entity — a named, isolated namespace for prompts.
 *
 * A store contains one or more projects. The CLI operates on the "default"
 * project unless configured otherwise, enabling multi-project workflows
 * (e.g. separate prompt libraries per app/team) within a single local store.
 */
export interface Project {
  /** Unique project id (a-z0-9-). */
  id: string;
  /** Display name. */
  name: string;
  /** Whether this is the default project. */
  isDefault: boolean;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
