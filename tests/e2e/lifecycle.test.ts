import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { PromptRepository } from "../../src/store/repository/prompt_repo.js";
import type { StoreData } from "../../src/store/schema.js";
import { createStoreData } from "../../src/store/schema.js";
import { diffVersions } from "../../src/diff/prompt-diff.js";
import { search } from "../../src/search/index.js";

/** Create a fresh in-memory store backed by a temp file for e2e testing. */
function makeTempStore(): { storeData: StoreData; tmpDir: string; storeFile: string } {
  const tmpDir = path.join(os.tmpdir(), `promptstash-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return { storeData: createStoreData(), tmpDir, storeFile: path.join(tmpDir, "store.json") };
}

describe("e2e: prompt lifecycle", () => {
  let tmpDir: string;
  let storeData: StoreData;
  let storeFile: string;
  let repo: PromptRepository;

  beforeEach(() => {
    const setup = makeTempStore();
    tmpDir = setup.tmpDir;
    storeData = setup.storeData;
    storeFile = setup.storeFile;
    repo = new PromptRepository(storeData);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // Simulate persist by writing to disk
  async function persist() {
    await fs.mkdir(path.dirname(storeFile), { recursive: true });
    await fs.writeFile(storeFile, JSON.stringify(storeData), "utf8");
  }

  it("add + update + diff + tag + list + search + rm", async () => {
    // 1. Create a prompt
    const { prompt, version } = repo.create({
      name: "code-reviewer",
      body: "Review this {{language}} code for bugs.",
      description: "Reviews code for bugs",
      tags: ["code", "review"],
      message: "Initial version",
    });
    await persist();
    expect(prompt.name).toBe("code-reviewer");
    expect(prompt.currentVersion).toBe(1);
    expect(version.variables).toContain("language");
    expect(prompt.tags).toContain("code");

    // 2. Update to v2
    const { prompt: p2, version: v2 } = repo.update("code-reviewer", {
      body: "Review this {{language}} code for {{issueType}} bugs.\nAlso check {{additionalCriteria}}.",
      message: "Add issueType and additionalCriteria",
    });
    await persist();
    expect(p2.currentVersion).toBe(2);
    expect(v2.variables).toContain("issueType");
    expect(v2.variables).toContain("additionalCriteria");

    // 3. List all
    const all = repo.list();
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe("code-reviewer");

    // 4. List filtered by tag
    const tagged = repo.list({ tag: "review" });
    expect(tagged).toHaveLength(1);
    const notFound = repo.list({ tag: "nonexistent" });
    expect(notFound).toHaveLength(0);

    // 5. Versions list
    const versions = repo.versions("code-reviewer");
    expect(versions).toHaveLength(2);
    expect(versions[0]!.versionNumber).toBe(1);
    expect(versions[1]!.versionNumber).toBe(2);

    // 6. Get specific version
    const v1 = repo.version("code-reviewer", 1);
    expect(v1.variables).not.toContain("issueType");

    // 7. Diff v1 vs v2
    const diff = diffVersions(v1, versions[1]!);
    expect(diff.hasChanges).toBe(true);
    expect(diff.addedVariables).toContain("issueType");
    expect(diff.addedVariables).toContain("additionalCriteria");
    expect(diff.removedVariables).toHaveLength(0);

    // 8. Tag
    repo.setTag("code-reviewer", "stable", 1);
    await persist();
    expect(p2.tags).toContain("stable");

    // 9. Remove tag
    repo.removeTag("code-reviewer", "stable");
    expect(p2.tags).not.toContain("stable");

    // 10. Search
    await persist();
    const hits = search(storeData, "code-reviewer");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.prompt.name).toBe("code-reviewer");

    // 11. Remove prompt
    repo.remove("code-reviewer");
    await persist();
    expect(repo.list()).toHaveLength(0);
    expect(() => repo.get("code-reviewer")).toThrow();
  });

  it("PromptExistsError on duplicate name", async () => {
    repo.create({ name: "dup-test", body: "First body" });
    expect(() => repo.create({ name: "dup-test", body: "Duplicate body" })).toThrow();

    // Force should work
    const result = repo.create({ name: "dup-test", body: "Overwritten body", force: true });
    expect(result.version.versionNumber).toBeGreaterThan(1);
  });

  it("InvalidPromptNameError rejects bad names", () => {
    const bad = ["BadName", "bad_name", "123bad", "bad name", ""];
    for (const name of bad) {
      expect(() => repo.create({ name, body: "test" })).toThrow();
    }
    // Valid names should work
    expect(() => repo.create({ name: "valid-name-123", body: "ok" })).not.toThrow();
  });

  it("PromptNotFoundError on missing prompt", () => {
    expect(() => repo.get("nonexistent")).toThrow();
    expect(() => repo.version("nonexistent", 1)).toThrow();
  });
});