import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli/index.ts",
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "node20",
  platform: "node",
  banner: { js: "#!/usr/bin/env node" },
});
