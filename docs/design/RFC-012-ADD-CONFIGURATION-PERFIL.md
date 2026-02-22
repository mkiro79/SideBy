# RFC-012 — Add Configuration: Perfil de Usuario

**Estado:** Propuesto  
**Fecha:** 2026-02-22  
**Autor:** Arquitecto MERN  
**Rama:** `feature/RFC-012-add-configuration-perfil`

---

## 1. Resumen Ejecutivo

Implementar la pantalla de **Configuración > Perfil** que permite al usuario autenticado:

1. **Consultar** su información personal (nombre, email, método de autenticación).
2. **Actualizar** su nombre de perfil.
3. **Eliminar** su cuenta de forma permanente (hard delete con cascada en datasets).

---

## 2. Decisiones Arquitectónicas Tomadas

| Decisión | Elección |
|---|---|
| Campos editables en el perfil | Solo `name` (email siempre read-only) |
| Tipo de eliminación | Hard delete (remove MongoDB document) |
| Confirmación en BE para delete | No requerida — basta el JWT válido |
| Cascade al eliminar cuenta | Sí — eliminar todos los datasets del usuario |

---

## 3. Análisis Arquitectónico

### Estado actual del módulo `users`

```
src/modules/users/
├── domain/
│   ├── user.entity.ts              ✅ Completo
│   ├── user.repository.interface.ts ⚠️ Falta: deleteById
│   └── user.entity.test.ts         ✅ Existe
├── infrastructure/
│   ├── user.schema.ts              ✅ Completo
│   ├── mongo-user.repository.ts    ⚠️ Falta: deleteById
│   └── mongo-user.repository.test.ts ✅ Existe
├── application/                    ❌ No existe
├── presentation/                   ❌ No existe
└── __tests__/                      ❌ No existe
```

### Módulo `datasets` — impacto por cascada

```
DatasetRepository (interface) ⚠️ Falta: deleteByOwnerId
MongoDatasetRepository        ⚠️ Falta: deleteByOwnerId implementation
```

---

## 4. Endpoints REST

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Obtiene perfil del usuario autenticado | JWT |
| `PUT` | `/api/v1/users/me/profile` | Actualiza nombre del usuario | JWT |
| `DELETE` | `/api/v1/users/me` | Elimina la cuenta permanentemente + cascada | JWT |

### GET /api/v1/users/me — Response 200
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "isGoogleUser": true,
    "avatar": "https://...",
    "role": "user",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/v1/users/me/profile — Request Body
```json
{ "name": "Jane Doe" }
```
Response 200: mismo formato que GET /me

### DELETE /api/v1/users/me — Response 204 (No Content)

---

## 5. TDD Specifications — Fase Red

### 5.1 Use Cases (Unit Tests)

#### `GetUserProfileUseCase.test.ts`
- ✅ Debe retornar el perfil del usuario cuando el ID existe
- ✅ Debe lanzar `UserNotFoundError` cuando el ID no existe

#### `UpdateUserProfileUseCase.test.ts`
- ✅ Debe actualizar el nombre del usuario y retornar el perfil actualizado
- ✅ Debe lanzar `UserNotFoundError` cuando el ID no existe
- ✅ Debe rechazar si el nombre está vacío (`DomainError`)

#### `DeleteUserAccountUseCase.test.ts`
- ✅ Debe eliminar el usuario y sus datasets en cascada
- ✅ Debe lanzar `UserNotFoundError` cuando el ID no existe
- ✅ Debe llamar `deleteByOwnerId` en el dataset repository

### 5.2 Controller / Integration (opcional fase posterior)

---

## 6. Plan de Implementación Paso a Paso

### Paso 1 — Ampliar contratos de repositorios (Domain)

**[BE]** `apps/api/src/modules/users/domain/user.repository.interface.ts`
- Agregar método: `deleteById(id: string): Promise<void>`

**[BE]** `apps/api/src/modules/datasets/domain/DatasetRepository.ts`
- Agregar método: `deleteByOwnerId(ownerId: string): Promise<void>`

### Paso 2 — Implementar en infraestructura

**[BE]** `apps/api/src/modules/users/infrastructure/mongo-user.repository.ts`
- Implementar `deleteById`

**[BE]** `apps/api/src/modules/datasets/infrastructure/mongoose/MongoDatasetRepository.ts`
- Implementar `deleteByOwnerId`

### Paso 3 — Errores de dominio

**[BE]** `apps/api/src/modules/users/domain/errors/UserNotFoundError.ts`
- `UserNotFoundError extends DomainError`

### Paso 4 — Use Cases (TDD: Red → Green → Refactor)

**[BE]** `apps/api/src/modules/users/application/get-user-profile/`
- `GetUserProfileUseCase.ts`
- `UserProfileDto.ts`

**[BE]** `apps/api/src/modules/users/application/update-user-profile/`
- `UpdateUserProfileUseCase.ts`
- `UpdateUserProfileDto.ts`

**[BE]** `apps/api/src/modules/users/application/delete-user-account/`
- `DeleteUserAccountUseCase.ts`

### Paso 5 — Tests unitarios

**[BE]** `apps/api/src/modules/users/__tests__/unit/`
- `GetUserProfileUseCase.test.ts`
- `UpdateUserProfileUseCase.test.ts`
- `DeleteUserAccountUseCase.test.ts`

### Paso 6 — Presentation Layer

**[BE]** `apps/api/src/modules/users/presentation/user.controller.ts`
- `getProfile()` → llama `GetUserProfileUseCase`
- `updateProfile()` → llama `UpdateUserProfileUseCase`
- `deleteAccount()` → llama `DeleteUserAccountUseCase`

**[BE]** `apps/api/src/modules/users/presentation/user.routes.ts`
- Todas las rutas protegidas con `authMiddleware`

**[BE]** `apps/api/src/modules/users/presentation/user.swagger.ts`
- Documentación OpenAPI de los 3 endpoints

### Paso 7 — Registrar rutas

**[BE]** `apps/api/src/v1/routes.ts`
- `v1Router.use("/users", usersRoutes)`

---

## 7. Frontend — Siguiente Iteración (Agente FE)

### Feature a crear

```
apps/client/src/features/settings/
├── pages/
│   └── SettingsPage.tsx           (tabs: Settings / Perfil)
├── components/
│   ├── PersonalInfoCard.tsx
│   └── DangerZoneCard.tsx
├── hooks/
│   ├── useUserProfile.ts          (GET /users/me)
│   ├── useUpdateProfile.ts        (PUT /users/me/profile)
│   └── useDeleteAccount.ts        (DELETE /users/me)
├── store/
│   └── profile.store.ts           (Zustand)
└── types/
    └── user-profile.types.ts      (DTOs)
```

### Referencia visual
Ver screenshot adjunto en la tarea — diseño ya definido en SideBy-Design.

---

## 8. Dependency Rule Check

```
Presentation  →  Application  →  Domain  ←  Infrastructure
UserController   GetUserProfileUseCase   IUserRepository   MongoUserRepository
                 UpdateUserProfileUseCase
                 DeleteUserAccountUseCase  ←  IDatasetRepository (cross-module)
```

**Nota:** `DeleteUserAccountUseCase` depende de `IDatasetRepository` (interface del módulo datasets) para ejecutar la cascada. Esto es válido en Clean Architecture — la capa Application puede depender de ports de otros módulos.

---

## 9. Criterios de Aceptación

- [ ] `GET /api/v1/users/me` devuelve 200 con perfil completo
- [ ] `PUT /api/v1/users/me/profile` solo acepta cambios en `name` y devuelve perfil actualizado
- [ ] `DELETE /api/v1/users/me` elimina usuario + todos sus datasets y devuelve 204
- [ ] Todos los endpoints devuelven 401 si no hay JWT válido
- [ ] Tests unitarios de los 3 Use Cases en verde
- [ ] Sin `console.log` — solo logging via Pino
- [ ] Swagger/OpenAPI documentado
