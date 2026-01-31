/**
 * Setup file for integration tests
 *
 * NOTE: Environment variables are set in globalSetup.integration.ts
 * which runs BEFORE imports (required for modules that read env vars at import time).
 *
 * This file runs AFTER imports but BEFORE each test file.
 * Use it for:
 * - Global mocks (vi.mock)
 * - Extending expect with custom matchers
 * - Test utilities that need module imports
 */

// Example: Add custom matchers or global mocks here
// import { expect } from "vitest";
// expect.extend({ ... });

console.log("✅ Integration test setup complete");
