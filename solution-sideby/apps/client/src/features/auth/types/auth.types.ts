/**
 * Tipos de Autenticación - Contrato con Backend
 *
 * Estos tipos DEBEN coincidir exactamente con la respuesta del backend.
 * Backend API: POST /api/v1/auth/google
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// ============================================================================
// AUTH RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AuthError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface GoogleLoginRequest {
  token: string;
}

// ============================================================================
// STATE TYPES (para el store)
// ============================================================================

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
