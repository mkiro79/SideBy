import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "**/*.test.ts"],
    },
    env: {
      NODE_ENV: "development",
      ALLOW_GOOGLE_AUTH_BYPASS: "false",
      GOOGLE_CLIENT_ID: "test-client-id",
      JWT_SECRET: "test-jwt-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
