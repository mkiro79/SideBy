import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules/**"],
    pool: "forks",
    singleFork: true, // Tests secuenciales (importante para DB) - migrated from poolOptions
    testTimeout: 60000, // 60 segundos (descarga de MongoDB puede tardar)
    hookTimeout: 120000, // 120 segundos para beforeAll (descarga MongoDB)
    // CRITICAL: globalSetup runs BEFORE test files are imported
    // setupFiles runs AFTER imports, which is too late for env vars
    globalSetup: "./src/test/globalSetup.integration.ts",
    setupFiles: ["./src/test/setup.integration.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
