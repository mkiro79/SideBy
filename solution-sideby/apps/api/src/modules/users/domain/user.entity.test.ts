import { describe, it, expect } from "vitest";
import { User } from "@/modules/users/domain/user.entity.js";
import { DomainError } from "@/shared/domain/errors/domain.error.js";

describe("User Entity", () => {
  describe("Success Cases", () => {
    it("should create a user with password authentication", () => {
      const userData = {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        name: "John Doe",
      };

      const user = new User(userData);

      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.name).toBe(userData.name);
    });

    it("should create a user with Google authentication", () => {
      const userData = {
        id: "user-123",
        email: "test@example.com",
        googleId: "google-oauth-id-123",
        name: "John Doe",
        avatar: "https://example.com/avatar.jpg",
      };

      const user = new User(userData);

      expect(user.googleId).toBe(userData.googleId);
      expect(user.avatar).toBe(userData.avatar);
      expect(user.passwordHash).toBeUndefined();
    });

    it("should create a user with both password and Google authentication", () => {
      const user = new User({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        googleId: "google-oauth-id-123",
        name: "John Doe",
      });

      expect(user.passwordHash).toBe("hashed_password_123");
      expect(user.googleId).toBe("google-oauth-id-123");
    });

    it("should assign default role as 'user'", () => {
      const user = new User({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        name: "John Doe",
      });

      expect(user.role).toBe("user");
    });

    it("should allow custom role assignment", () => {
      const user = new User({
        id: "user-123",
        email: "admin@example.com",
        passwordHash: "hashed_password_123",
        name: "Admin User",
        role: "admin",
      });

      expect(user.role).toBe("admin");
    });

    it("should set createdAt to current date by default", () => {
      const beforeCreation = new Date();

      const user = new User({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        name: "John Doe",
      });

      const afterCreation = new Date();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
    });

    it("should allow custom createdAt date", () => {
      const customDate = new Date("2024-01-01");

      const user = new User({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        name: "John Doe",
        createdAt: customDate,
      });

      expect(user.createdAt).toEqual(customDate);
    });

    it("should set updatedAt equal to createdAt by default", () => {
      const user = new User({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        name: "John Doe",
      });

      expect(user.updatedAt).toEqual(user.createdAt);
    });
  });

  describe("Error Cases", () => {
    it("should throw DomainError for invalid email format", () => {
      expect(
        () =>
          new User({
            id: "user-123",
            email: "invalid-email",
            passwordHash: "hashed_password_123",
            name: "John Doe",
          }),
      ).toThrow(DomainError);
    });

    it("should throw DomainError with descriptive message for invalid email", () => {
      expect(
        () =>
          new User({
            id: "user-123",
            email: "not-an-email",
            passwordHash: "hashed_password_123",
            name: "John Doe",
          }),
      ).toThrow("Invalid email format");
    });

    it("should throw DomainError for empty email", () => {
      expect(
        () =>
          new User({
            id: "user-123",
            email: "",
            passwordHash: "hashed_password_123",
            name: "John Doe",
          }),
      ).toThrow(DomainError);
    });

    it("should throw DomainError for email without domain", () => {
      expect(
        () =>
          new User({
            id: "user-123",
            email: "test@",
            passwordHash: "hashed_password_123",
            name: "John Doe",
          }),
      ).toThrow(DomainError);
    });

    it("should throw DomainError when no authentication method is provided", () => {
      expect(
        () =>
          new User({
            id: "user-123",
            email: "test@example.com",
            name: "John Doe",
          }),
      ).toThrow("User must have either a password or Google authentication");
    });
  });
});
