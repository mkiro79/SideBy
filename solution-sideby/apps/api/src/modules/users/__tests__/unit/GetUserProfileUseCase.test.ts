import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetUserProfileUseCase } from "@/modules/users/application/get-user-profile/GetUserProfileUseCase.js";
import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import { User } from "@/modules/users/domain/user.entity.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";

/**
 * Tests unitarios del caso de uso GetUserProfileUseCase.
 * Verifica que se recupera y mapea correctamente el perfil del usuario.
 */
describe("GetUserProfileUseCase", () => {
  let useCase: GetUserProfileUseCase;
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

    useCase = new GetUserProfileUseCase(mockUserRepository);
  });

  it("debe retornar el perfil del usuario cuando el ID existe", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);

    const result = await useCase.execute("user-123");

    expect(result).toEqual({
      id: "user-123",
      name: "John Doe",
      email: "test@example.com",
      isGoogleUser: true,
      avatar: undefined,
      role: "user",
      createdAt: "2025-01-01T00:00:00.000Z",
    });
    expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
  });

  it("debe mapear isGoogleUser como false para usuarios con contraseña", async () => {
    const passwordUser = new User({
      id: "user-456",
      email: "pass@example.com",
      name: "Jane Doe",
      passwordHash: "hashed-password",
      role: "user",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    vi.mocked(mockUserRepository.findById).mockResolvedValue(passwordUser);

    const result = await useCase.execute("user-456");

    expect(result.isGoogleUser).toBe(false);
  });

  it("debe lanzar UserNotFoundError cuando el ID no existe", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute("unknown-id")).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
