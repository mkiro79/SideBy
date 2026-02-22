/**
 * DTO de respuesta del perfil de usuario.
 * Expone solo los campos necesarios para el cliente, evitando datos sensibles.
 */
export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  /** Indica si el usuario se autenticó via Google OAuth */
  isGoogleUser: boolean;
  avatar?: string;
  role: string;
  createdAt: string;
}
