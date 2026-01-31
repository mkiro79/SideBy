/**
 * Google OAuth payload after token verification
 */
export interface GoogleUserPayload {
  email: string;
  googleId: string;
  name: string;
  picture?: string;
}

/**
 * Port interface for Google OAuth service
 * Implementation will handle token verification with Google's API
 */
export interface IGoogleAuthService {
  /**
   * Verifies a Google OAuth token and returns user information
   * @param token - The Google OAuth ID token
   * @returns User information from Google
   * @throws Error if token is invalid or expired
   */
  verify(token: string): Promise<GoogleUserPayload>;
}

/**
 * Port interface for JWT token generation service
 * Implementation will handle signing and verifying JWT tokens
 */
export interface ITokenService {
  /**
   * Signs a payload and generates a JWT token
   * @param payload - The data to encode in the token
   * @returns The signed JWT token
   */
  sign(payload: object): string;

  /**
   * Verifies and decodes a JWT token
   * @param token - The JWT token to verify
   * @returns The decoded payload or null if invalid
   */
  verify(token: string): object | null;
}
