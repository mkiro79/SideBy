import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateUserProfileUseCase } from "@/modules/users/application/update-user-profile/UpdateUserProfileUseCase.js";
import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { User } from "@/modules/users/domain/user.entity.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";
import { DomainError } from "@/shared/domain/errors/domain.error.js";

/**
 * Tests unitarios del caso de uso UpdateUserProfileUseCase.
 * Verifica que solo el nombre puede ser actualizado y que las validaciones funcionan.
 */
describe("UpdateUserProfileUseCase", () => {
  let useCase: UpdateUserProfileUseCase;
  let mockUserRepository: IUserRepository;

  const mockUser = new User({
    id: "user-123",
    email: "test@example.com",
    name: "John Doe",
    googleId: "google-abc",
    role: "user",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  });

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findByGoogleId: vi.fn(),
      findById: vi.fn(),
      deleteById: vi.fn(),
    };

    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  it("debe actualizar el nombre del usuario y retornar el perfil actualizado", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
    vi.mocked(mockUserRepository.save).mockResolvedValue();

    const result = await useCase.execute("user-123", { name: "Jane Doe" });

    expect(result.name).toBe("Jane Doe");
    expect(result.email).toBe("test@example.com");
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    const savedUser = vi.mocked(mockUserRepository.save).mock.calls[0][0];
    expect(savedUser.name).toBe("Jane Doe");
  });

  it("debe trimear los espacios del nombre antes de guardar", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
    vi.mocked(mockUserRepository.save).mockResolvedValue();

    const result = await useCase.execute("user-123", { name: "  Jane Doe  " });

    expect(result.name).toBe("Jane Doe");
  });

  it("debe lanzar DomainError si el nombre está vacío", async () => {
    await expect(useCase.execute("user-123", { name: "" })).rejects.toThrow(
      DomainError,
    );
  });

  it("debe lanzar DomainError si el nombre es solo espacios", async () => {
    await expect(useCase.execute("user-123", { name: "   " })).rejects.toThrow(
      DomainError,
    );
  });

  it("debe lanzar UserNotFoundError cuando el ID no existe", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute("unknown-id", { name: "New Name" }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
