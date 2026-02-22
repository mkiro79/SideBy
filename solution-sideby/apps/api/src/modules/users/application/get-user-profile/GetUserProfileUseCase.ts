import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";
import type { UserProfileDto } from "./UserProfileDto.js";

/**
 * Caso de uso: Obtener perfil del usuario autenticado.
 * Recupera los datos públicos del usuario a partir de su ID.
 */
export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isGoogleUser: !!user.googleId,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
