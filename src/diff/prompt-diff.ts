/**
 * Prompt diffing — structured diff across two versions of a prompt body.
 *
 * We use the battle-tested `diff` package (jsdiff) for line-level unified diff
 * and augment it with first-class variable changes, which prompt engineers
 * care about most (added/removed {{variables}} often the real signal of change).
 */

import { createTwoFilesPatch, diffLines } from "diff";
import type { Version } from "../core/version.js";

export interface PromptDiffResult {
  /** Unified-diff text suitable for terminal display. */
  unified: string;
  /** Variables present in v2 but not v1. */
  addedVariables: string[];
  /** Variables present in v1 but not v2. */
  removedVariables: string[];
  /** Count of changed lines (added + removed). */
  addedLines: number;
  removedLines: number;
  /** Whether any change exists between the two versions. */
  hasChanges: boolean;
}

export function diffVersions(v1: Version, v2: Version): PromptDiffResult {
  const headerA = `v${v1.versionNumber}`;
  const headerB = `v${v2.versionNumber}`;
  const unified = createTwoFilesPatch(
    headerA,
    headerB,
    v1.body,
    v2.body,
    "",
    "",
    { context: 3 },
  );

  const changes = diffLines(v1.body, v2.body);
  let addedLines = 0;
  let removedLines = 0;
  for (const part of changes) {
    const lineCount = (part.value ?? "").split("\n").filter(Boolean).length;
    if (part.added) addedLines += lineCount;
    else if (part.removed) removedLines += lineCount;
  }

  const set1 = new Set(v1.variables);
  const set2 = new Set(v2.variables);
  const addedVariables = [...set2].filter((v) => !set1.has(v));
  const removedVariables = [...set1].filter((v) => !set2.has(v));

  return {
    unified,
    addedVariables,
    removedVariables,
    addedLines,
    removedLines,
    hasChanges:
      addedLines > 0 ||
      removedLines > 0 ||
      addedVariables.length > 0 ||
      removedVariables.length > 0,
  };
}
