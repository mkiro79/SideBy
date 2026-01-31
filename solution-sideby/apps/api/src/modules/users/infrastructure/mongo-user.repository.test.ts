import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { MongoUserRepository } from "./mongo-user.repository.js";
import { User } from "@/modules/users/domain/user.entity.js";

describe("MongoUserRepository", () => {
  let mongoServer: MongoMemoryServer;
  let repository: MongoUserRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongoUserRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe("save", () => {
    it("should persist a user with password authentication", async () => {
      const user = new User({
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed_password_123",
        name: "John Doe",
      });

      await repository.save(user);

      const foundUser = await repository.findByEmail("test@example.com");
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(user.email);
      expect(foundUser?.passwordHash).toBe(user.passwordHash);
      expect(foundUser?.name).toBe(user.name);
      expect(foundUser?.role).toBe("user");
    });

    it("should persist a user with Google authentication", async () => {
      const user = new User({
        id: "user-456",
        email: "google@example.com",
        googleId: "google-oauth-id-123",
        name: "Google User",
        avatar: "https://example.com/avatar.jpg",
      });

      await repository.save(user);

      const foundUser = await repository.findByGoogleId("google-oauth-id-123");
      expect(foundUser).not.toBeNull();
      expect(foundUser?.googleId).toBe(user.googleId);
      expect(foundUser?.avatar).toBe(user.avatar);
    });

    it("should update an existing user when saving with same id", async () => {
      const user = new User({
        id: "user-789",
        email: "original@example.com",
        passwordHash: "hashed_password_123",
        name: "Original Name",
      });

      await repository.save(user);

      const updatedUser = new User({
        id: "user-789",
        email: "updated@example.com",
        passwordHash: "new_hashed_password",
        name: "Updated Name",
        role: "admin",
      });

      await repository.save(updatedUser);

      const foundUser = await repository.findById("user-789");
      expect(foundUser?.email).toBe("updated@example.com");
      expect(foundUser?.name).toBe("Updated Name");
      expect(foundUser?.role).toBe("admin");
    });
  });

  describe("findByEmail", () => {
    it("should return null when user is not found", async () => {
      const foundUser = await repository.findByEmail("nonexistent@example.com");
      expect(foundUser).toBeNull();
    });

    it("should return a domain User entity (not a Mongoose document)", async () => {
      const user = new User({
        id: "user-entity-test",
        email: "entity@example.com",
        passwordHash: "hashed_password_123",
        name: "Entity Test",
      });

      await repository.save(user);

      const foundUser = await repository.findByEmail("entity@example.com");

      // Should be a User instance, not a Mongoose document
      expect(foundUser).toBeInstanceOf(User);
      expect(foundUser?.createdAt).toBeInstanceOf(Date);
      expect(foundUser?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("findByGoogleId", () => {
    it("should return null when user is not found", async () => {
      const foundUser = await repository.findByGoogleId(
        "nonexistent-google-id",
      );
      expect(foundUser).toBeNull();
    });

    it("should find user by Google ID", async () => {
      const user = new User({
        id: "google-user-123",
        email: "googleuser@example.com",
        googleId: "google-oauth-specific-id",
        name: "Google Auth User",
      });

      await repository.save(user);

      const foundUser = await repository.findByGoogleId(
        "google-oauth-specific-id",
      );
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe("googleuser@example.com");
    });
  });

  describe("findById", () => {
    it("should return null when user is not found", async () => {
      const foundUser = await repository.findById("nonexistent-id");
      expect(foundUser).toBeNull();
    });

    it("should find user by internal ID", async () => {
      const user = new User({
        id: "specific-user-id",
        email: "byid@example.com",
        passwordHash: "hashed_password_123",
        name: "Find By ID Test",
      });

      await repository.save(user);

      const foundUser = await repository.findById("specific-user-id");
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe("specific-user-id");
    });
  });
});
