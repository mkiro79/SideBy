import jwt from "jsonwebtoken";
import type { ITokenService } from "@/modules/auth/application/interfaces/auth-services.interface.js";
import logger from "@/utils/logger.js";

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    this.secret = secret;
    this.expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  }

  sign(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    } as jwt.SignOptions);
  }

  verify(token: string): object | null {
    try {
      return jwt.verify(token, this.secret) as object;
    } catch (error) {
      logger.error({ err: error }, "Failed to verify JWT token");
      return null;
    }
  }
}
