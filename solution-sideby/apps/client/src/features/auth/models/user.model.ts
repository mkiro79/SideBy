/**
 * User model interface matching backend response structure
 * @see apps/api/src/modules/users/domain/user.entity.ts
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  subscriptionStatus: "free" | "active";
}

/**
 * Type guard to check if user has admin privileges
 * @param user - The user object to check
 * @returns true if user role is 'admin'
 */
export function isAdmin(user: User): boolean {
  return user.role === "admin";
}

/**
 * Factory function to create an empty user object
 * Useful for initializing React state before fetching real user data
 * @returns A User object with default empty values
 */
export function createEmptyUser(): User {
  return {
    id: "",
    email: "",
    name: "",
    role: "user",
    subscriptionStatus: "free",
  };
}
