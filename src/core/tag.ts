/** Tag entity — a lightweight alias pointing at a specific version. */
export interface Tag {
  /** Tag name (a-z0-9-). */
  name: string;
  /** Prompt id the tag belongs to. */
  promptId: string;
  /** Pinned version number. */
  versionNumber: number;
  /** ISO-8601 timestamp. */
  createdAt: string;
}
