#!/usr/bin/env node

/**
 * Pre-push hook: Run tests only for changed files
 * Optimizes test execution by running only tests related to modified files
 */

import { execSync } from "node:child_process";

const API_PATH = "solution-sideby/apps/api";
const CLIENT_PATH = "solution-sideby/apps/client";

try {
  // Get list of changed files between local and remote
  const changedFiles = execSync("git diff --name-only @{u}..HEAD", {
    encoding: "utf-8",
  })
    .split("\n")
    .filter(Boolean);

  // Check which apps have changed files
  const apiFilesChanged = changedFiles.some(
    (file) => file.startsWith(API_PATH) && file.endsWith(".ts")
  );

  const clientFilesChanged = changedFiles.some(
    (file) =>
      file.startsWith(CLIENT_PATH) &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
  );

  let testsRan = false;

  // Run API tests if API files changed (unit tests only)
  if (apiFilesChanged) {
    console.log("📝 API files changed, running API unit tests...\n");
    execSync("npm run test:unit --prefix solution-sideby/apps/api", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    testsRan = true;
  }

  // Run Client tests if Client files changed
  if (clientFilesChanged) {
    console.log("🎨 Client files changed, running Client tests...\n");
    execSync("npm run test:run --prefix solution-sideby/apps/client", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    testsRan = true;
  }

  if (testsRan) {
    console.log("\n✅ All tests passed!");
  } else {
    console.log("ℹ️  No app files changed, skipping tests");
  }
} catch (error) {
  console.error("\n❌ Tests failed!");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}
