import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Skip bun-adapter tests when not running in Bun
    exclude: typeof globalThis.Bun === "undefined" ? ["src/bun-adapter.test.ts"] : [],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts", // Re-exports only
        "src/interfaces/**", // Type definitions only
        "src/utils/index.ts", // Re-exports only
        "src/bun-adapter.ts", // Requires Bun runtime
        "src/nest-bun-application.ts", // Requires Bun runtime and NestJS
      ],
      ignoreEmptyLines: true,
      thresholds: {
        // Some code paths require Bun runtime (file handling, ReadableStream/Blob in Response)
        // When running with Bun, these thresholds should be 100%
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
