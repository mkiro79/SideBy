import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";
import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";

/**
 * Caso de uso: Eliminar la cuenta del usuario de forma permanente (hard delete).
 * Aplica cascade delete sobre todos los datasets del usuario antes de eliminarlo.
 */
export class DeleteUserAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly datasetRepository: DatasetRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Cascade: eliminar todos los datasets del usuario primero
    await this.datasetRepository.deleteByOwnerId(userId);

    // Eliminación definitiva del usuario
    await this.userRepository.deleteById(userId);
  }
}
