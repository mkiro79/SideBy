/**
 * Global Setup for Integration Tests
 *
 * This file runs BEFORE any test files are imported.
 * This is critical because some modules (like GoogleAuthService)
 * read environment variables at import time.
 *
 * setupFiles run AFTER imports are resolved, which is too late.
 * globalSetup runs BEFORE the test runner even loads the test files.
 */

export default function globalSetup(): void {
  // Set environment variables BEFORE any modules are imported
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
  process.env.JWT_SECRET = "test-jwt-secret-for-integration-tests";
  process.env.NODE_ENV = "test";

  console.log(
    "[globalSetup] Environment variables configured for integration tests",
  );
}
