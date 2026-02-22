import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteUserAccountUseCase } from "@/modules/users/application/delete-user-account/DeleteUserAccountUseCase.js";
import type { IUserRepository } from "@/modules/users/domain/user.repository.interface.js";
import type { DatasetRepository } from "@/modules/datasets/domain/DatasetRepository.js";
import { User } from "@/modules/users/domain/user.entity.js";
import { UserNotFoundError } from "@/modules/users/domain/errors/UserNotFoundError.js";

/**
 * Tests unitarios del caso de uso DeleteUserAccountUseCase.
 * Verifica el hard delete del usuario con cascade sobre sus datasets.
 */
describe("DeleteUserAccountUseCase", () => {
  let useCase: DeleteUserAccountUseCase;
  let mockUserRepository: IUserRepository;
  let mockDatasetRepository: Pick<DatasetRepository, "deleteByOwnerId">;

  const mockUser = new User({
    id: "user-123",
    email: "test@example.com",
    name: "John Doe",
    googleId: "google-abc",
    role: "user",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  });

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      findByEmail: vi.fn(),
      findByGoogleId: vi.fn(),
      findById: vi.fn(),
      deleteById: vi.fn(),
    };

    mockDatasetRepository = {
      deleteByOwnerId: vi.fn(),
    };

    useCase = new DeleteUserAccountUseCase(
      mockUserRepository,
      mockDatasetRepository as DatasetRepository,
    );
  });

  it("debe eliminar los datasets en cascada y luego al usuario", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
    vi.mocked(mockDatasetRepository.deleteByOwnerId).mockResolvedValue();
    vi.mocked(mockUserRepository.deleteById).mockResolvedValue();

    await useCase.execute("user-123");

    expect(mockDatasetRepository.deleteByOwnerId).toHaveBeenCalledWith(
      "user-123",
    );
    expect(mockUserRepository.deleteById).toHaveBeenCalledWith("user-123");
  });

  it("debe eliminar los datasets ANTES de eliminar al usuario", async () => {
    const callOrder: string[] = [];
    vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
    vi.mocked(mockDatasetRepository.deleteByOwnerId).mockImplementation(
      async () => {
        callOrder.push("deleteByOwnerId");
      },
    );
    vi.mocked(mockUserRepository.deleteById).mockImplementation(async () => {
      callOrder.push("deleteById");
    });

    await useCase.execute("user-123");

    expect(callOrder).toEqual(["deleteByOwnerId", "deleteById"]);
  });

  it("debe lanzar UserNotFoundError cuando el ID no existe", async () => {
    vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute("unknown-id")).rejects.toThrow(
      UserNotFoundError,
    );
    expect(mockDatasetRepository.deleteByOwnerId).not.toHaveBeenCalled();
    expect(mockUserRepository.deleteById).not.toHaveBeenCalled();
  });
});
