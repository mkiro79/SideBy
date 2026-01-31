import { describe, it, expect } from "vitest";
import type { User } from "./user.model";
import { isAdmin, createEmptyUser } from "./user.model";

describe("User Model", () => {
  describe("isAdmin", () => {
    it("should return true when user role is admin", () => {
      const adminUser: User = {
        id: "admin-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        subscriptionStatus: "active",
      };

      expect(isAdmin(adminUser)).toBe(true);
    });

    it("should return false when user role is user", () => {
      const regularUser: User = {
        id: "user-123",
        email: "user@example.com",
        name: "Regular User",
        role: "user",
        subscriptionStatus: "free",
      };

      expect(isAdmin(regularUser)).toBe(false);
    });
  });

  describe("createEmptyUser", () => {
    it("should return an object that satisfies the User interface with empty values", () => {
      const emptyUser = createEmptyUser();

      expect(emptyUser.id).toBe("");
      expect(emptyUser.email).toBe("");
      expect(emptyUser.name).toBe("");
      expect(emptyUser.role).toBe("user");
      expect(emptyUser.subscriptionStatus).toBe("free");
      expect(emptyUser.avatar).toBeUndefined();
    });

    it("should return a new object on each call (not a singleton)", () => {
      const user1 = createEmptyUser();
      const user2 = createEmptyUser();

      expect(user1).not.toBe(user2);
      expect(user1).toEqual(user2);
    });
  });
});
