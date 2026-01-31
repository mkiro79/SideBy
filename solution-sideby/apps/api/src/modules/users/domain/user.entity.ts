import { DomainError } from "@/shared/domain/errors/domain.error.js";

export type UserRole = "user" | "admin";

export interface UserProps {
  id: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly passwordHash?: string;
  public readonly googleId?: string;
  public readonly name: string;
  public readonly avatar?: string;
  public readonly role: UserRole;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.validateEmail(props.email);
    this.validateAuthMethod(props.passwordHash, props.googleId);

    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.googleId = props.googleId;
    this.name = props.name;
    this.avatar = props.avatar;
    this.role = props.role ?? "user";
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? this.createdAt;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      throw new DomainError("Invalid email format");
    }
  }

  private validateAuthMethod(passwordHash?: string, googleId?: string): void {
    if (!passwordHash && !googleId) {
      throw new DomainError(
        "User must have either a password or Google authentication",
      );
    }
  }
}
