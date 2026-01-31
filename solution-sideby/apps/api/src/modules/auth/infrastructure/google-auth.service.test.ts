import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GoogleAuthService } from "./google-auth.service.js";

describe("GoogleAuthService", () => {
  let service: GoogleAuthService;

  beforeEach(() => {
    // Setup required env vars
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    service = new GoogleAuthService();
  });

  afterEach(() => {
    // Clean up test-specific env vars
    delete process.env.ALLOW_GOOGLE_AUTH_BYPASS;
    vi.restoreAllMocks();
  });

  describe("Development Bypass Security", () => {
    it("should reject SKIP_GOOGLE_CHECK when ALLOW_GOOGLE_AUTH_BYPASS is false", async () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "false";

      await expect(service.verify("SKIP_GOOGLE_CHECK")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it("should reject SKIP_GOOGLE_CHECK when ALLOW_GOOGLE_AUTH_BYPASS is not set", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.ALLOW_GOOGLE_AUTH_BYPASS;

      await expect(service.verify("SKIP_GOOGLE_CHECK")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it("should reject SKIP_GOOGLE_CHECK in production even with ALLOW_GOOGLE_AUTH_BYPASS=true", async () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "true";

      await expect(service.verify("SKIP_GOOGLE_CHECK")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it("should reject SKIP_GOOGLE_CHECK in test environment even with ALLOW_GOOGLE_AUTH_BYPASS=true", async () => {
      process.env.NODE_ENV = "test";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "true";

      await expect(service.verify("SKIP_GOOGLE_CHECK")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it("should allow SKIP_GOOGLE_CHECK only when both NODE_ENV=development AND ALLOW_GOOGLE_AUTH_BYPASS=true", async () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "true";

      const result = await service.verify("SKIP_GOOGLE_CHECK");

      expect(result).toMatchObject({
        email: "mock_user@sideby.com",
        googleId: "mock-google-id-123",
        name: "Mock Developer",
        picture: "https://via.placeholder.com/150",
      });
    });

    it('should reject ALLOW_GOOGLE_AUTH_BYPASS when value is "True" (wrong case)', async () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "True"; // Wrong case

      await expect(service.verify("SKIP_GOOGLE_CHECK")).rejects.toThrow(
        "Invalid Google token"
      );
    });

    it('should reject ALLOW_GOOGLE_AUTH_BYPASS when value is "TRUE" (wrong case)', async () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "TRUE"; // Wrong case

      await expect(service.verify("SKIP_GOOGLE_CHECK")).rejects.toThrow(
        "Invalid Google token"
      );
    });
  });

  describe("Real Token Verification", () => {
    it("should attempt real Google verification for non-bypass tokens", async () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOW_GOOGLE_AUTH_BYPASS = "false";

      // This will fail because it's not a real token, but it proves we're not using bypass
      await expect(service.verify("some-real-token")).rejects.toThrow(
        "Invalid Google token"
      );
    });
  });
});
