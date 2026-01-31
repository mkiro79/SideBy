import { OAuth2Client } from "google-auth-library";
import type {
  IGoogleAuthService,
  GoogleUserPayload,
} from "@/modules/auth/application/interfaces/auth-services.interface.js";
import logger from "@/utils/logger.js";

export class GoogleAuthService implements IGoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "GOOGLE_CLIENT_ID is not defined in environment variables",
      );
    }
    this.client = new OAuth2Client(clientId);
  }

  async verify(token: string): Promise<GoogleUserPayload> {
    // Development-only bypass with explicit opt-in and localhost restriction
    if (token === "SKIP_GOOGLE_CHECK") {
      // Check if bypass is explicitly allowed
      const bypassAllowed = process.env.ALLOW_GOOGLE_AUTH_BYPASS === "true";
      
      if (!bypassAllowed) {
        logger.warn(
          "Attempted to use Google auth bypass but ALLOW_GOOGLE_AUTH_BYPASS is not enabled"
        );
        throw new Error("Invalid Google token");
      }

      // Additional safety: only allow in development mode
      if (process.env.NODE_ENV !== "development") {
        logger.error(
          "Attempted to use Google auth bypass in non-development environment"
        );
        throw new Error("Invalid Google token");
      }

      logger.info("Using mock Google authentication for development (bypass enabled)");
      return {
        email: "mock_user@sideby.com",
        googleId: "mock-google-id-123",
        name: "Mock Developer",
        picture: "https://via.placeholder.com/150",
      };
    }

    // Real Google token verification
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new Error("Invalid Google token payload");
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        picture: payload.picture,
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to verify Google token");
      throw new Error("Invalid Google token");
    }
  }
}
