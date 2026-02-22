# 🚀 Feature Flags & Configuration Guide - SideBy

Complete reference of all activation/deactivation flags and configuration variables across the SideBy monorepo.

---

## 📋 Table of Contents

1. [Frontend Feature Flags](#frontend-feature-flags)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Backend Environment Variables](#backend-environment-variables)
4. [Backend Feature Flags](#backend-feature-flags)
5. [How to Enable/Disable Features](#how-to-enabledisable-features)
6. [Quick Reference Checklist](#quick-reference-checklist)

---

## 🎨 Frontend Feature Flags

Frontend feature flags are managed in **[`apps/client/src/config/features.ts`](../solution-sideby/apps/client/src/config/features.ts)** and controlled via `VITE_FEATURE_*` environment variables.

### Active Feature Flags

| Flag Name | Env Variable | Default | Description | Location |
|-----------|--------------|---------|-------------|----------|
| **EMAIL_LOGIN** | `VITE_FEATURE_EMAIL_LOGIN` | `false` | Email/Password login (alternative to Google OAuth) | Entire auth system |
| **AI_ENABLED** | `VITE_FEATURE_AI_ENABLED` | `false` | AI prompt analysis in dataset configuration | Dataset wizard (ConfigurationStep) |
| **DATASET_EDIT_ENABLED** | `VITE_FEATURE_DATASET_EDIT_ENABLED` | `true` | Edit dataset metadata (button & routing) | DatasetCard & DatasetDetail page |

### Future Feature Flags (Commented)

```typescript
// ADVANCED_FILTERS: import.meta.env.VITE_FEATURE_ADVANCED_FILTERS === 'true' || false,
// EXPORT_PDF: import.meta.env.VITE_FEATURE_EXPORT_PDF === 'true' || false,
```

### Helper Function

**`isFeatureEnabled(feature: keyof FeatureFlags): boolean`**
- Centralized way to check if a feature is enabled
- Usage: `if (isFeatureEnabled('AI_ENABLED')) { ... }`
- Location: [features.ts](../solution-sideby/apps/client/src/config/features.ts)

---

## 🔗 Frontend Environment Variables

Set these in **`.env.local`** (frontend root: `solution-sideby/apps/client/`):

### API Configuration
```dotenv
VITE_API_URL=http://localhost:3000
```
- Backend API URL
- Determines all API calls to the backend
- Used in: [auth.repository.ts](../solution-sideby/apps/client/src/infrastructure/api/repositories/auth.repository.ts), [datasets.api.ts](../solution-sideby/apps/client/src/features/dataset/services/datasets.api.ts)

### OAuth Configuration
```dotenv
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```
- Google OAuth 2.0 app ID
- Required for Google authentication
- Used in: [GoogleAuthProvider](../solution-sideby/apps/client/src/features/auth/hooks/useGoogleAuth.ts)

### EmailJS Configuration
```dotenv
VITE_EMAILJS_SERVICE_ID=<service-id>
VITE_EMAILJS_TEMPLATE_ID=<template-id>
VITE_EMAILJS_PUBLIC_KEY=<public-key>
```
- EmailJS integration for contact form
- Used in: [ContactPage.tsx](../solution-sideby/apps/client/src/features/public/pages/ContactPage.tsx)
- Required for production contact form

### App Metadata
```dotenv
VITE_APP_NAME=SideBy
VITE_APP_VERSION=1.0.0
VITE_ENV=development
```
- Application configuration
- Optional for versioning/identification

### Sentry (Optional)
```dotenv
VITE_SENTRY_DSN=<sentry-dsn>
```
- Error tracking (not yet fully integrated)

### Contact Email Override
```dotenv
VITE_CONTACT_EMAIL=<email>
```
- Overrides default from [contact.ts](../solution-sideby/apps/client/src/config/contact.ts)
- Used in: [ContactPage](../solution-sideby/apps/client/src/features/public/pages/ContactPage.tsx)

### Development-only Flags
```typescript
import.meta.env.DEV  // true in development, false in production
```
- Used to conditionally load/manage development tools
- Example: React Query DevTools in [App.tsx](../solution-sideby/apps/client/src/App.tsx)

---

## ⚙️ Backend Environment Variables

Set these in **`.env`** (backend root: `solution-sideby/apps/api/`):

### Server Configuration
```dotenv
PORT=3000
NODE_ENV=development  # development|test|production
```

### Database
```dotenv
MONGO_URI=mongodb://localhost:27017/sideby
# For Docker:
MONGO_URI=mongodb://username:password@mongo:27017/sideby?authSource=username
```

### JWT Authentication
```dotenv
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```
- Used in: [jwt-token.service.ts](../solution-sideby/apps/api/src/modules/auth/infrastructure/jwt-token.service.ts)

### CORS
```dotenv
CORS_ORIGIN=http://localhost:5173
```
- Controls frontend origins allowed to connect
- Critical for development <-> production switching

### Google OAuth
```dotenv
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
ALLOW_GOOGLE_AUTH_BYPASS=false
```

#### ALLOW_GOOGLE_AUTH_BYPASS Behavior
- **Invalid in Production**: Attempting to bypass OAuth in production will throw an error
- **Development Only**: Set to `true` only in `NODE_ENV=development`
- **Validation**: Case-sensitive (`true` only, not `True` or `TRUE`)
- Location: [google-auth.service.ts](../solution-sideby/apps/api/src/modules/auth/infrastructure/google-auth.service.ts)

### Logging
```dotenv
LOG_LEVEL=info  # error|warn|info|debug|trace
```
- Controls Pino logger verbosity
- Used in: [logger.ts](../solution-sideby/apps/api/src/utils/logger.ts)

---

## 🤖 Backend Feature Flags

### Insights LLM Configuration

| Variable | Default | Description | Location |
|----------|---------|-------------|----------|
| **INSIGHTS_LLM_ENABLED** | `false` | Enable/disable AI narrative generation | [insights.controller.ts](../solution-sideby/apps/api/src/modules/insights/presentation/insights.controller.ts) |
| **INSIGHTS_LLM_PROVIDER** | `ollama` | LLM provider (`ollama`, `openai`) | - |
| **INSIGHTS_LLM_BASE_URL** | `http://localhost:11434/v1` | LLM endpoint URL | - |
| **INSIGHTS_LLM_MODEL** | `gemma2:9b` | Model name (alt: `qwen2.5:7b-instruct`) | - |
| **INSIGHTS_LLM_API_KEY** | `ollama` | API key/authentication | - |
| **INSIGHTS_LLM_TIMEOUT_MS** | `120000` | Request timeout in milliseconds | - |
| **INSIGHTS_LLM_PROMPT_VERSION** | `v1` | Prompt template version | [insights.controller.ts](../solution-sideby/apps/api/src/modules/insights/presentation/insights.controller.ts) |

### Insights Caching
```dotenv
INSIGHTS_SUMMARY_CACHE_TTL_SECONDS=86400  # 24 hours
```
- Time-to-live for cached insights summaries
- Used in: [InsightCacheSchema.ts](../solution-sideby/apps/api/src/modules/insights/infrastructure/mongoose/InsightCacheSchema.ts)

### Dataset Constraints
```
DATASET_MAX_ROWS=50000  # Configurable via process.env
MAX_AI_CONTEXT_LENGTH=500  # Characters
MAX_AI_ANALYSIS_LENGTH=5000  # Characters
```
- Hardcoded in: [validation.rules.ts](../solution-sideby/apps/api/src/modules/datasets/domain/validation.rules.ts)

### Seed Configuration
```dotenv
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=SecurePassword123
SEED_ADMIN_GOOGLE_ID=optional-google-id
SEED_ADMIN_NAME=Admin User
```
- Bootstrap admin user on database initialization
- Used in: [seed.ts](../solution-sideby/apps/api/src/scripts/seed.ts)

---

## 🎛️ How to Enable/Disable Features

### Frontend (React + Vite)

**1. Local Development**

Update **`solution-sideby/apps/client/.env.local`**:

```bash
# Enable AI features
VITE_FEATURE_AI_ENABLED=true

# Enable email login
VITE_FEATURE_EMAIL_LOGIN=true

# Keep dataset editing disabled
VITE_FEATURE_DATASET_EDIT_ENABLED=false
```

**2. In Component Code**

```typescript
import { FEATURES, isFeatureEnabled } from '@/config/features.js';

export function MyComponent() {
  // Option 1: Direct import
  if (FEATURES.AI_ENABLED) {
    return <AIPromptSection />;
  }

  // Option 2: Helper function
  if (isFeatureEnabled('EMAIL_LOGIN')) {
    return <EmailLoginForm />;
  }

  return <GoogleOAuthButton />;
}
```

**3. Test Coverage**

```typescript
import { vi } from 'vitest';
import { FEATURES } from '@/config/features.js';

it('should show AI section when feature is enabled', () => {
  vi.mocked(FEATURES).AI_ENABLED = true;
  // Test AI rendering
});
```

### Backend (Node.js + Express)

**1. Global Database Flags**

Dataset-level AI configuration (stored in database):
```typescript
// aiConfig in Dataset model
interface AIConfig {
  enabled: boolean;
  userContext?: string;
  enabledFeatures?: {
    insights: boolean;
  };
}
```

Usage:
```typescript
const narrativeEnabled = 
  aiConfig?.enabledFeatures?.insights === true || 
  aiConfig?.enabled === true;
```

Location: [UpdateMappingUseCase.ts](../solution-sideby/apps/api/src/modules/datasets/application/use-cases/UpdateMappingUseCase.ts)

**2. Backend Runtime Flags**

Update **`solution-sideby/apps/api/.env`**:

```bash
# Enable LLM insights
INSIGHTS_LLM_ENABLED=true

# Configure LLM provider
INSIGHTS_LLM_PROVIDER=ollama
INSIGHTS_LLM_BASE_URL=http://localhost:11434/v1
INSIGHTS_LLM_MODEL=gemma2:9b
```

**3. Using in Code**

```typescript
// insights.controller.ts
const llmEnabled = process.env.INSIGHTS_LLM_ENABLED === "true";
const promptVersion = process.env.INSIGHTS_LLM_PROMPT_VERSION ?? "v1";

if (llmEnabled && promptVersion === "v2") {
  // Use advanced LLM logic
}
```

**4. Development Bypass (Restricted)**

```bash
# development only!
NODE_ENV=development
ALLOW_GOOGLE_AUTH_BYPASS=true
```

⚠️ **Warning**: This flag MUST NOT be set in production. It will throw an error.

---

## 🔒 Security Considerations

### ✅ Best Practices

- **Never hardcode feature flags** in source code
- **Always use environment variables** for toggles
- **Test with flags disabled** to ensure graceful degradation
- **Use server-side validation** for backend features
- **Log flag changes** for audit trails

### 🚫 What NOT to Do

```typescript
// ❌ BAD: Hardcoded
if (true) { enableAI(); }

// ❌ BAD: Missing env var fallback
const enabled = process.env.FEATURE_X;  // Could be undefined

// ❌ BAD: Case insensitivity
const bypass = process.env.ALLOW_GOOGLE_AUTH_BYPASS === "True";  // Fails
```

### ✅ What to DO

```typescript
// ✅ GOOD: Environment variable with fallback
const enabled = process.env.INSIGHTS_LLM_ENABLED === "true";

// ✅ GOOD: Typed feature flags
const feature = isFeatureEnabled("AI_ENABLED");

// ✅ GOOD: Case-sensitive check
const bypass = process.env.ALLOW_GOOGLE_AUTH_BYPASS === "true";
```

---

## 📊 Quick Reference Checklist

### 🟢 Development Setup

- [ ] Copy `.env.example` to `.env.local` (frontend) and `.env` (backend)
- [ ] Set `VITE_GOOGLE_CLIENT_ID` for auth
- [ ] Set `MONGO_URI` for database connection
- [ ] Set `JWT_SECRET` (use strong key)
- [ ] Enable desired features in frontend `.env.local`
- [ ] Configure `INSIGHTS_LLM_*` if using AI features
- [ ] Run `npm install` in each app

### 🟡 Staging/Testing

- [ ] All feature flags set to production values
- [ ] `NODE_ENV=staging` or `NODE_ENV=production`
- [ ] Secrets loaded from secure vault (not `.env` files)
- [ ] `ALLOW_GOOGLE_AUTH_BYPASS=false`
- [ ] CORS configured for staging domain
- [ ] Database backups enabled

### 🔴 Production

- [ ] All secrets managed by environment (Docker secrets, CI/CD, etc.)
- [ ] `NODE_ENV=production`
- [ ] `ALLOW_GOOGLE_AUTH_BYPASS=false` (strict)
- [ ] CORS restricted to frontend domain only
- [ ] Logging set to `info` or `warn` (not `debug`)
- [ ] HTTPS enforced everywhere
- [ ] Regular security audits

---

## 📁 Configuration Files Reference

### Frontend
- **Main config**: [features.ts](../solution-sideby/apps/client/src/config/features.ts)
- **Example env**: [.env.example](../solution-sideby/apps/client/.env.example)
- **Contact config**: [contact.ts](../solution-sideby/apps/client/src/config/contact.ts)
- **Tests**: [features.test.ts](../solution-sideby/apps/client/src/config/__tests__/features.test.ts)

### Backend
- **Example env**: [.env.example](../solution-sideby/apps/api/.env.example)
- **DB config**: [database.ts](../solution-sideby/apps/api/src/config/database.ts)
- **Logger config**: [logger.ts](../solution-sideby/apps/api/src/utils/logger.ts)
- **Auth service**: [google-auth.service.ts](../solution-sideby/apps/api/src/modules/auth/infrastructure/google-auth.service.ts)
- **Insights controller**: [insights.controller.ts](../solution-sideby/apps/api/src/modules/insights/presentation/insights.controller.ts)

---

## 🆘 Troubleshooting

### Feature Not Showing Up
1. ✅ Check `.env.local` / `.env` is set to `true`
2. ✅ Verify environment variable name (case-sensitive)
3. ✅ Restart dev server: `npm run dev`
4. ✅ Check browser console for errors
5. ✅ Verify `isFeatureEnabled()` is imported correctly

### API Connection Failed
1. ✅ Backend running on correct `PORT`
2. ✅ `VITE_API_URL` matches backend address
3. ✅ CORS_ORIGIN in backend `.env` matches frontend origin
4. ✅ Check browser Network tab for CORS errors

### Google OAuth Not Working
1. ✅ `VITE_GOOGLE_CLIENT_ID` configured on frontend
2. ✅ `GOOGLE_CLIENT_ID` configured on backend
3. ✅ OAuth consent screen approved
4. ✅ Dev bypass: `ALLOW_GOOGLE_AUTH_BYPASS=true` only in dev
5. ✅ Check browser console for auth errors

### AI Features Not Generating
1. ✅ `VITE_FEATURE_AI_ENABLED=true` on frontend
2. ✅ `INSIGHTS_LLM_ENABLED=true` on backend
3. ✅ Ollama/LLM service running on `INSIGHTS_LLM_BASE_URL`
4. ✅ Dataset has `aiConfig.enabled=true`
5. ✅ Check backend logs with `LOG_LEVEL=debug`

---

**Last Updated**: 2024
**Maintainer**: SideBy Team
