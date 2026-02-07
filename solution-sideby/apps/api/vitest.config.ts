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
      // Explicitly disable Google auth bypass in tests as a safety measure.
      // The service also guards on NODE_ENV, but this ensures tests never
      // accidentally enable the bypass via environment configuration.
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
