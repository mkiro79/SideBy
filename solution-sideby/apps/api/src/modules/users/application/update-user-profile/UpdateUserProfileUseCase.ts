import { User } from "@/modules/users/domain/user.entity.js";
import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";
import { DomainError } from "@/shared/domain/errors/domain.error.js";
import type { UserProfileDto } from "@/modules/users/application/get-user-profile/UserProfileDto.js";
import type { UpdateUserProfileDto } from "./UpdateUserProfileDto.js";

/**
 * Caso de uso: Actualizar el nombre del perfil del usuario autenticado.
 * El email siempre es read-only y no puede modificarse aquí.
 */
export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const trimmedName = dto.name?.trim();

    if (!trimmedName) {
      throw new DomainError("El nombre no puede estar vacío");
    }

    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      throw new UserNotFoundError(userId);
    }

    // Reconstruimos la entidad con el nombre actualizado (inmutabilidad)
    const updated = new User({
      id: existing.id,
      email: existing.email,
      passwordHash: existing.passwordHash,
      googleId: existing.googleId,
      name: trimmedName,
      avatar: existing.avatar,
      role: existing.role,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    await this.userRepository.save(updated);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      isGoogleUser: !!updated.googleId,
      avatar: updated.avatar,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
