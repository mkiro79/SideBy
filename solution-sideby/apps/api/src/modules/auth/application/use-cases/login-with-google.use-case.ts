import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { User } from "@/modules/users/domain/user.entity.js";
import type {
  IGoogleAuthService,
  ITokenService,
} from "@/modules/auth/application/interfaces/auth-services.interface.js";
import { randomUUID } from "node:crypto";

/**
 * Response DTO for login operation
 */
export interface LoginResult {
  user: User;
  token: string;
}

/**
 * Use Case: Login with Google OAuth
 * Orchestrates the authentication flow using Google OAuth tokens
 */
export class LoginWithGoogleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly googleAuthService: IGoogleAuthService,
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Executes the login with Google flow
   * @param googleToken - The Google OAuth ID token from the client
   * @returns The authenticated user and JWT token
   */
  async execute(googleToken: string): Promise<LoginResult> {
    // Step 1: Verify Google token and get user info
    const googleUserInfo = await this.googleAuthService.verify(googleToken);

    // Step 2: Check if user already exists
    let user = await this.userRepository.findByGoogleId(
      googleUserInfo.googleId,
    );

    // Step 3: If user doesn't exist, create new user
    if (!user) {
      user = new User({
        id: randomUUID(),
        email: googleUserInfo.email,
        googleId: googleUserInfo.googleId,
        name: googleUserInfo.name,
        avatar: googleUserInfo.picture,
        role: "user",
      });

      await this.userRepository.save(user);
    }

    // Step 4: Generate JWT token
    const token = this.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Step 5: Return result
    return {
      user,
      token,
    };
  }
}
