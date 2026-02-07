# [RFC-001] Authentication & Identity Module (Google OAuth + JWT)

| Metadata | Details |
| :--- | :--- |
| **Author** | User |
| **Status** | **Ready for Dev** |
| **Date** | 2026-02-07 |
| **Scope** | `apps/api/src/modules/auth`, `apps/client/src/features/auth` |
| **Based on** | UC-AUTH-01 to UC-AUTH-05, UC-USER-01 |

## 1. Context & Scope
We need to implement a secure, low-friction authentication system using **Google OAuth 2.0** as the primary identity provider. This module manages User Identity, Session Persistence, and Role-Based Access Control (RBAC).

* **Goal:** Allow users to sign up/login via Google and access protected routes (`/dashboard`).
* **Key Behavior:** "Upsert" Logic - If a user logs in with Google and doesn't exist, create them automatically.

## 2. Proposed Solution (Architecture)

### High Level Flow
1.  **Frontend:** User clicks "Continue with Google" -> Gets `idToken` from Google.
2.  **Frontend:** Sends `idToken` to Backend API (`POST /auth/google`).
3.  **Backend:** Verifies token with Google Servers.
4.  **Backend:** Finds user by email OR creates a new user (Role: `user`, Plan: `free`).
5.  **Backend:** Issues a custom JWT (Access Token).
6.  **Frontend:** Stores JWT in LocalStorage (per UC-AUTH-03) + Updates Zustand Store.

## 3. Backend Specification (`apps/api`)

### 3.1 Domain Layer (`modules/auth/domain`, `modules/users/domain`)
**Entity: User**
```typescript
interface User {
  id: string;
  email: string;       // Unique, Index
  googleId: string;    // Unique, Index
  fullName: string;
  avatarUrl?: string;
  role: 'admin' | 'user';  // Default: 'user' (UC-USER-01)
  plan: 'free' | 'pro';    // Default: 'free' (UC-AUTH-02)
  createdAt: Date;
}

3.2 Application Layer (modules/auth/application)
Use Cases:

LoginWithGoogleUseCase:

Input: googleToken: string.

Logic: Verify token -> Find/Create User -> Generate JWT.

Output: { user: UserDTO, token: string }.

VerifySessionUseCase:

Input: userId (from JWT).

Logic: Check if user exists and is active.

DTOs:

AuthResponseDTO: { token: string, user: UserDTO }

3.3 Infrastructure Layer (modules/auth/infrastructure)
Persistence: Mongoose Schema for users collection.

Services:

GoogleAuthService: Wrapper around google-auth-library to verify tokens.

JwtService: Wrapper around jsonwebtoken to sign/verify app tokens.

3.4 Presentation Layer (API Contract / OpenAPI)
POST /api/v1/auth/google

Body: { "token": "eyJhbGciOi..." }

Responses: 200 OK, 401 Unauthorized.

GET /api/v1/auth/me (Protected)

Headers: Authorization: Bearer <token>

Response: 200 OK { user: ... }

4. Frontend Specification (apps/client)
4.1 Feature Structure (features/auth)
Hooks:

useGoogleLogin: Handles the popup and API call.

useAuth: Exposes user, isAuthenticated, logout().

Store (Zustand):

authStore: Holds { user, token }.

Persistence: Use persist middleware (to localStorage) for Re-hydration (UC-AUTH-03).

Components:

GoogleLoginButton: UI trigger.

RequireAuth (Guard): Higher-Order Component or Wrapper. Checks isAuthenticated. If false, redirects to /.

RedirectIfAuthenticated: If true, redirects to /dashboard (UC-NAV-01).

4.2 UX/UI
Landing Page (/): Public. Shows GoogleLoginButton.

Dashboard (/dashboard): Protected. Only visible if logged in.

Logout: Clears store & LocalStorage -> Redirects to / (UC-AUTH-04).

5. TDD Strategy (Test Scenarios)
Backend (Vitest)
[LoginWithGoogleUseCase] should create a new user if email does not exist in DB.

[LoginWithGoogleUseCase] should return existing user if email matches.

[LoginWithGoogleUseCase] should throw InvalidTokenError if Google verification fails.

[UserEntity] should default role to 'user' and plan to 'free'.

Frontend (Vitest + Testing Library)
[useAuthStore] should persist state to localStorage after login.

[RequireAuth] should redirect unauthenticated users to home.

[RequireAuth] should render children for authenticated users.

6. Security (OWASP & Safety)
Token Verification: NEVER trust the payload without verifying signature against Google's keys.

Validation: Use Zod to validate req.body.token is a string.

Secrets: JWT_SECRET and GOOGLE_CLIENT_ID must be loaded from process.env.

Environment: Ensure .env is in .gitignore.

7. Configuration Variables needed
GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

JWT_SECRET

JWT_EXPIRES_IN (e.g., "7d")