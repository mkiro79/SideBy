Listado de Casos de Uso - Proyecto SideBy
1. Módulo de Autenticación (Auth & Identity)
Estado: En Desarrollo / Definido

El objetivo principal es delegar la seguridad en Google (OAuth 2.0) y gestionar sesiones mediante JWT propios.

UC-AUTH-01: Iniciar Sesión con Google (Social Login)

Actor: Usuario Visitante.

Descripción: El usuario pulsa "Continue with Google" en el Frontend. Se obtiene un token de Google, se envía al Backend para verificación y se recibe una sesión válida.

Flujo: Frontend (OAuth SDK) -> Backend (Verify Token) -> JWT Issue.

UC-AUTH-02: Registro Automático (Sign Up via Login)

Actor: Nuevo Usuario.

Descripción: Si un usuario se autentica con Google y no existe en la base de datos, el sistema debe crear su cuenta automáticamente (Upsert) extrayendo email, nombre y avatar de Google.

Regla de Negocio: Todo registro nuevo nace con rol user y plan free.

UC-AUTH-03: Persistencia de Sesión (Re-hidratación)

Actor: Sistema (Frontend).

Descripción: Si el usuario recarga la página, la sesión debe mantenerse activa sin pedir login de nuevo.

Implementación: Almacenamiento seguro en LocalStorage + Zustand (Middleware Persist).

UC-AUTH-04: Logout (Cierre de Sesión)

Actor: Usuario Logueado.

Descripción: El usuario decide salir. El sistema debe eliminar el token del almacenamiento local y redirigir a la Landing Page pública.

UC-AUTH-05: Protección de Rutas (Auth Guard)

Actor: Sistema.

Descripción: Un usuario anónimo no puede acceder a /dashboard ni a sus sub-rutas. Debe ser redirigido a /login o /. Un usuario logueado no puede ver /login, debe ser redirigido a /dashboard.

2. Módulo de Usuarios (Users Domain)
Estado: Definido / Estructura Base

Gestión de la información del perfil y roles.

UC-USER-01: Identificación de Rol (Admin vs User)

Actor: Sistema.

Descripción: El sistema debe distinguir si el usuario actual tiene permisos administrativos (basado en el campo role de la entidad).

Uso: Para mostrar/ocultar opciones en el Dashboard o permitir seeding.

UC-USER-02: Gestión de Estado de Suscripción

Actor: Sistema / Pasarela de Pago (Futuro).

Descripción: El usuario posee un estado (free, active, past_due). El sistema debe limitar funcionalidades basándose en este estado (ej: límite de comparaciones para usuarios free).

3. Módulo Core / Datasets (La Propuesta de Valor)
Estado: Conceptual / Diseñado en Landing

Estos casos de uso se derivan de tu slogan "Compare Smarter, Decide Faster" y los elementos definidos para la Landing Page.

UC-CORE-01: Carga de Archivos (Data Ingestion)

Actor: Usuario.

Descripción: El usuario debe poder subir archivos (CSV, Excel) a la plataforma para ser analizados. No debe de ocupar mas de un limite definido por configuración de la aplicacion. Los archivos deben ser validados antes de ser procesados.

UC-CORE-02: Mapeo de Columnas (Normalization)

Actor: Usuario.

Descripción: Tras subir un archivo, el usuario debe poder seleccionar qué columnas representan qué datos (ej: "Columna A es Precio", "Columna B es Nombre") para estandarizar la comparación.

UC-CORE-03: Visualización "Side-by-Side" (Comparación)

Actor: Usuario.

Descripción: El sistema debe mostrar dos o más conjuntos de datos en una vista dividida (Split Screen) para facilitar la detección visual de diferencias.

UC-CORE-04: Generación de Insights con IA

Actor: Usuario / Sistema (IA Agent).

Descripción: El usuario solicita un análisis y el sistema destaca automáticamente las diferencias críticas o anomalías entre los datos comparados.

4. Infraestructura y DevOps
Estado: Implementado

Casos de uso técnicos para el mantenimiento y desarrollo.

UC-OPS-01: Seeding de Base de Datos (Admin Bootstrap)

Actor: Desarrollador / DevOps.

Descripción: Capacidad de inyectar un usuario Administrador inicial mediante script seguro (npm run seed) usando variables de entorno, sin exponer credenciales en el código.

UC-OPS-02: Documentación Viva (Swagger/OpenAPI)

Actor: Desarrollador Frontend / Externo.

Descripción: El sistema debe generar documentación de API actualizada automáticamente basada en los esquemas de validación (Zod), accesible en /api/docs.

UC-OPS-03: Prevención de Fugas de Secretos

Actor: Sistema (Git Hooks).

Descripción: El sistema de control de versiones debe bloquear (Hard Block) cualquier intento de subir código que contenga patrones de claves o contraseñas (Husky + Lint-staged).

5. Navegación y UX (Frontend)
Estado: Definido

UC-NAV-01: Navegación Híbrida (Landing + App)

Actor: Usuario.

Descripción: La aplicación actúa como un SPA monolítico.

Si NO hay sesión -> Muestra Landing Page (Marketing).

Si SÍ hay sesión -> Muestra Dashboard (Producto).

La transición debe ser instantánea, sin recargas completas de navegador.