import { DomainError } from "@/shared/domain/errors/domain.error.js";

/**
 * Error de dominio lanzado cuando no se encuentra un usuario por un identificador dado.
 * Extiende DomainError para integrarse con el middleware de manejo de errores.
 */
export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Usuario con ID '${id}' no encontrado`);
    this.name = "UserNotFoundError";
    // Necesario para que instanceof funcione correctamente con herencia de Error en TS/ESM
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}
