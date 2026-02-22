/**
 * Tipos del perfil de usuario — Contrato con Backend
 *
 * Estos tipos DEBEN coincidir con la respuesta del backend:
 * GET /api/v1/users/me
 * PUT /api/v1/users/me/profile
 * DELETE /api/v1/users/me
 */

// ============================================================================
// USER PROFILE DTO
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  /** Indica si el usuario se autenticó via Google OAuth */
  isGoogleUser: boolean;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
}

// ============================================================================
// REQUEST / RESPONSE TYPES
// ============================================================================

export interface UpdateProfileRequest {
  name: string;
}

export interface UserProfileResponse {
  success: true;
  data: UserProfile;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
  };
}
