import type { User } from "./user.entity.js";

/**
 * Port interface for User persistence
 * This defines what the application needs from the persistence layer
 * Implementation details (MongoDB, PostgreSQL, etc.) are in infrastructure
 */
export interface IUserRepository {
  /**
   * Persists a user entity to the data store
   * @param user - The user domain entity to save
   */
  save(user: User): Promise<void>;

  /**
   * Finds a user by their email address
   * @param email - The email to search for
   * @returns The user entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user by their Google ID (OAuth)
   * @param googleId - The Google OAuth ID
   * @returns The user entity or null if not found
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Finds a user by their internal ID
   * @param id - The user's internal ID
   * @returns The user entity or null if not found
   */
  findById(id: string): Promise<User | null>;
}
