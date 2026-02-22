import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoginWithGoogleUseCase } from "./login-with-google.use-case.js";
import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import type {
  IGoogleAuthService,
  ITokenService,
} from "@/modules/auth/application/interfaces/auth-services.interface.js";
import { User } from "@/modules/users/domain/user.entity.js";

describe("LoginWithGoogleUseCase", () => {
  let useCase: LoginWithGoogleUseCase;
  let mockUserRepository: IUserRepository;
  let mockGoogleAuthService: IGoogleAuthService;
  let mockTokenService: ITokenService;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findByGoogleId: vi.fn(),
      findById: vi.fn(),
      deleteById: vi.fn(),
    };

   mockGoogleAuthService = {
     verify: vi.fn().mockResolvedValue({
       email: "test@example.com",
       googleId: "google-id-123",
       name: "Test User",
     }),
   };

    mockTokenService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    useCase = new LoginWithGoogleUseCase(
      mockUserRepository,
      mockGoogleAuthService,
      mockTokenService,
    );
  });

  describe("User Registration (New User)", () => {
    it("should create and save a new user when Google ID does not exist", async () => {
      const googleToken = "valid-google-token-123";
      const googleUserInfo = {
        email: "newuser@example.com",
        googleId: "google-id-new-user",
        name: "New User",
        picture: "https://example.com/avatar.jpg",
      };

      // Setup mocks
      vi.mocked(mockGoogleAuthService.verify).mockResolvedValue(googleUserInfo);
      vi.mocked(mockUserRepository.findByGoogleId).mockResolvedValue(null);
      vi.mocked(mockTokenService.sign).mockReturnValue("jwt-token-123");

      const result = await useCase.execute(googleToken);

      // Verify Google token was verified
      expect(mockGoogleAuthService.verify).toHaveBeenCalledWith(googleToken);

      // Verify repository was queried
      expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith(
        googleUserInfo.googleId,
      );

      // Verify user was saved
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      const savedUser = vi.mocked(mockUserRepository.save).mock.calls[0][0];
      expect(savedUser).toBeInstanceOf(User);
      expect(savedUser.email).toBe(googleUserInfo.email);
      expect(savedUser.googleId).toBe(googleUserInfo.googleId);
      expect(savedUser.name).toBe(googleUserInfo.name);
      expect(savedUser.avatar).toBe(googleUserInfo.picture);

      // Verify token was generated
      expect(mockTokenService.sign).toHaveBeenCalledWith({
        userId: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      });

      // Verify result
      expect(result.token).toBe("jwt-token-123");
      expect(result.user).toBeInstanceOf(User);
      expect(result.user.email).toBe(googleUserInfo.email);
    });

    it("should create user without avatar if not provided by Google", async () => {
      const googleUserInfo = {
        email: "noavatar@example.com",
        googleId: "google-id-no-avatar",
        name: "No Avatar User",
      };

      vi.mocked(mockGoogleAuthService.verify).mockResolvedValue(googleUserInfo);
      vi.mocked(mockUserRepository.findByGoogleId).mockResolvedValue(null);
      vi.mocked(mockTokenService.sign).mockReturnValue("jwt-token-456");

      const result = await useCase.execute("token");

      const savedUser = vi.mocked(mockUserRepository.save).mock.calls[0][0];
      expect(savedUser.avatar).toBeUndefined();
      expect(result.user.avatar).toBeUndefined();
    });
  });

  describe("User Login (Existing User)", () => {
    it("should NOT save user when Google ID already exists", async () => {
      const googleToken = "valid-google-token-456";
      const googleUserInfo = {
        email: "existing@example.com",
        googleId: "google-id-existing",
        name: "Existing User",
      };

      const existingUser = new User({
        id: "user-existing-123",
        email: googleUserInfo.email,
        googleId: googleUserInfo.googleId,
        name: googleUserInfo.name,
        role: "user",
      });

      // Setup mocks
      vi.mocked(mockGoogleAuthService.verify).mockResolvedValue(googleUserInfo);
      vi.mocked(mockUserRepository.findByGoogleId).mockResolvedValue(
        existingUser,
      );
      vi.mocked(mockTokenService.sign).mockReturnValue("jwt-token-existing");

      const result = await useCase.execute(googleToken);

      // Verify Google token was verified
      expect(mockGoogleAuthService.verify).toHaveBeenCalledWith(googleToken);

      // Verify repository was queried
      expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith(
        googleUserInfo.googleId,
      );

      // Verify user was NOT saved (existing user)
      expect(mockUserRepository.save).not.toHaveBeenCalled();

      // Verify token was generated
      expect(mockTokenService.sign).toHaveBeenCalledWith({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      });

      // Verify result
      expect(result.token).toBe("jwt-token-existing");
      expect(result.user).toBe(existingUser);
      expect(result.user.id).toBe("user-existing-123");
    });

    it("should preserve existing user role when logging in", async () => {
      const adminUser = new User({
        id: "admin-user-123",
        email: "admin@example.com",
        googleId: "google-admin-id",
        name: "Admin User",
        role: "admin",
      });

      vi.mocked(mockGoogleAuthService.verify).mockResolvedValue({
        email: "admin@example.com",
        googleId: "google-admin-id",
        name: "Admin User",
      });
      vi.mocked(mockUserRepository.findByGoogleId).mockResolvedValue(adminUser);
      vi.mocked(mockTokenService.sign).mockReturnValue("admin-token");

      const result = await useCase.execute("admin-token");

      expect(result.user.role).toBe("admin");
      expect(mockTokenService.sign).toHaveBeenCalledWith({
        userId: adminUser.id,
        email: adminUser.email,
        role: "admin",
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error when Google token is invalid", async () => {
      vi.mocked(mockGoogleAuthService.verify).mockRejectedValue(
        new Error("Invalid Google token"),
      );

      await expect(useCase.execute("invalid-token")).rejects.toThrow(
        "Invalid Google token",
      );

      expect(mockUserRepository.findByGoogleId).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockTokenService.sign).not.toHaveBeenCalled();
    });
  });
});
