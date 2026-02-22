import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { User } from "@/modules/users/domain/user.entity.js";
import { UserModel, type UserDocument } from "./user.schema.js";

/**
 * MongoDB implementation of the User Repository
 * Implements the port defined in domain layer
 */
export class MongoUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const document = UserMapper.toPersistence(user);

    await UserModel.findByIdAndUpdate(user.id, document, {
      upsert: true,
      new: true,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const document = await UserModel.findOne({
      email: email.toLowerCase(),
    }).lean();

    if (!document) {
      return null;
    }

    return UserMapper.toDomain(document as UserDocument);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const document = await UserModel.findOne({ googleId }).lean();

    if (!document) {
      return null;
    }

    return UserMapper.toDomain(document as UserDocument);
  }

  async findById(id: string): Promise<User | null> {
    const document = await UserModel.findById(id).lean();

    if (!document) {
      return null;
    }

    return UserMapper.toDomain(document as UserDocument);
  }

  async deleteById(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }
}

/**
 * Mapper to convert between Domain Entity and Persistence Model
 * Keeps the domain layer clean from infrastructure concerns
 */
class UserMapper {
  /**
   * Converts a Domain Entity to a Persistence Document
   */
  static toPersistence(user: User): Record<string, unknown> {
    return {
      _id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      googleId: user.googleId,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Converts a Persistence Document to a Domain Entity
   */
  static toDomain(document: UserDocument): User {
    return new User({
      id: document._id,
      email: document.email,
      passwordHash: document.passwordHash,
      googleId: document.googleId,
      name: document.name,
      avatar: document.avatar,
      role: document.role,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
