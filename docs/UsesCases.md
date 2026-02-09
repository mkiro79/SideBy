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
Normas de validación:
- Maximo de 2Mb por archivo.
- Solo formatos CSV y Excel.
- Validación de estructura (ej: mínimo 2 columnas, al menos una fila de datos).
- Validar que el archivo no contenga datos maliciosos (ej: scripts, macros).
- Validar que el archivo no exceda el límite de almacenamiento permitido para su plan (free vs premium).
- Proporcionar feedback claro al usuario en caso de error (ej: "Archivo demasiado grande", "Formato no soportado", "Archivo mal formado").
- Que la primera fila se interprete como encabezados de columna para facilitar el mapeo posterior.
- Que la cabecera de los 2 archivos sea igual para facilitar la comparación.

Ejemplo de Datos a guardar:

**Nombre en Mongo:** `datasets`

JSON

`{
  "_id": "ObjectId('98z7y6x5w4v3u2t1s0r9q8p7')",
  "ownerId": "ObjectId('65a1b2c3d4e5f6g7h8i9j0k1')", // Referencia al User
  "status": "ready", // "processing" | "ready" | "error"
  
  // Metadatos Generales
  "meta": {
    "name": "Q1 2024 vs Q1 2023 - Marketing",
    "description": "Comparativa de rendimiento de campañas.",
    "createdAt": "2024-01-26T10:00:00Z"
  },

  // Configuración de los Grupos (A vs B)
  // Esto define qué es cada color en la gráfica
  "sourceConfig": {
    "groupA": {
      "label": "Año Actual (2024)",
      "color": "#2563EB", // Azul SideBy
      "originalFileName": "ventas_2024.csv"
    },
    "groupB": {
      "label": "Año Anterior (2023)",
      "color": "#F97316", // Naranja SideBy
      "originalFileName": "ventas_2023.csv"
    }
  },

  // El Mapeo (Resultado del Wizard)
  "schemaMapping": {
    "dimensionField": "fecha", // La columna que actúa de Eje X
    "kpiFields": [
      { "id": "ingresos", "label": "Ingresos Totales", "format": "currency" },
      { "id": "visitas", "label": "Tráfico Web", "format": "number" },
      { "id": "rebote", "label": "Tasa de Rebote", "format": "percentage" }
    ]
  },

  // Configuración Visual (Templates)
  "dashboardLayout": {
    "templateId": "sideby_standard_v1",
    "highlightedKpis": ["ingresos", "visitas", "rebote"], // IDs de los KPIs arriba
    "rows": [
      // Aquí guardamos la disposición de widgets (como definimos antes)
      {
        "id": "row_main",
        "type": "full_width",
        "widgets": [{ "type": "chart_line", "title": "Tendencia", "dataConfig": { "kpi": "ingresos" } }]
      }
    ]
  },

  // Configuración de IA (Genkit)
  "aiConfig": {
    "enabled": true,
    "userContext": "Analiza esto como un CFO agresivo buscando recortar gastos."
  },

  // LOS DATOS UNIFICADOS (Array de Objetos Planos)
  // Nota: Mongo aguanta documentos de hasta 16MB. 
  // Para un MVP con CSVs de <50k filas, esto entra sobrado aquí.
  "data": [
    {
      "fecha": "2024-01-01",
      "pais": "España",
      "ingresos": 1500,
      "visitas": 300,
      "rebote": 0.45,
      "_source_group": "groupA" // <--- LA CLAVE MÁGICA
    },
    {
      "fecha": "2024-01-01", // Misma fecha, diferente grupo
      "pais": "España",
      "ingresos": 1200,
      "visitas": 280,
      "rebote": 0.50,
      "_source_group": "groupB" // <--- LA CLAVE MÁGICA
    }
    // ... miles de filas más
  ]
}`

Ejemplo de entidad en typescript:

```typescript   
`// Tipos auxiliares
export type DatasetStatus = 'processing' | 'ready' | 'error';

export interface KPIField {
  id: string; // key en el objeto data
  label: string;
  format: 'number' | 'currency' | 'percentage';
}

export interface GroupConfig {
  label: string;
  color: string;
  originalFileName: string;
}

// Tipo flexible para la fila de datos (ya que las columnas cambian según el CSV)
export interface DataRow {
  _source_group: 'groupA' | 'groupB';
  [key: string]: string | number | boolean; // Índice de firma para propiedades dinámicas
}

// La Entidad Principal
export interface Dataset {
  id: string;
  ownerId: string;
  status: DatasetStatus;
  
  meta: {
    name: string;
    description?: string;
    createdAt: Date;
  };

  sourceConfig: {
    groupA: GroupConfig;
    groupB: GroupConfig;
  };

  schemaMapping: {
    dimensionField: string;
    kpiFields: KPIField[];
  };

  dashboardLayout: {
    templateId: string;
    highlightedKpis: string[];
    rows: any[]; // Puedes tipar esto más estricto con la interfaz de Widgets que hicimos antes
  };

  aiConfig?: {
    enabled: boolean;
    userContext?: string;
    lastAnalysis?: string; // Cache del resultado de la IA
  };

  data: DataRow[];
}`



UC-CORE-02: Mapeo de Columnas y Configuración Final (Wizard Steps 2 & 3)

Actor: Usuario.

Descripción: Tras subir dos archivos CSV/Excel (Grupo A vs Grupo B), el usuario debe completar un wizard de 2 pasos adicionales para preparar el dataset para visualización:

**PASO 2: Mapeo de Columnas (ColumnMappingStep)**
- El usuario selecciona qué columna actúa como "Dimensión" (Eje X, ej: fecha, producto, región).
- El usuario configura los "KPIs Numéricos" (Eje Y, métricas a comparar):
  - Añade/remueve KPIs de la lista de columnas disponibles
  - Asigna un label descriptivo a cada KPI
  - Selecciona el formato de cada KPI: número, moneda (currency), o porcentaje
- El sistema valida que al menos 1 dimensión y 1 KPI estén configurados antes de continuar.

**PASO 3: Configuración y Revisión Final (ConfigurationStep)**
- El usuario debe proporcionar un **nombre** para el report (obligatorio, máximo 100 caracteres).
- (Opcional - Controlado por Feature Flag) Si `FEATURE_AI_ENABLED=true`:
  - El usuario puede habilitar el "Análisis con IA"
  - Si está habilitado, puede proporcionar un **prompt de contexto** para la IA (máximo 500 caracteres)
  - Ejemplo: "Analiza esto como un CFO buscando optimizar costos"
- El sistema muestra un **resumen completo** de la configuración:
  - Información de archivos (Archivo A, Archivo B: nombres, cantidad de filas, periodos detectados)
  - Métricas del dataset unificado (filas totales, campo de dimensión, campo de fecha si aplica, cantidad de KPIs)
  - Lista de KPIs seleccionados con sus formatos
- El usuario revisa el resumen y confirma para finalizar.
- Al confirmar, el sistema guarda la configuración completa (metadata, schemaMapping, dashboardLayout, aiConfig) via `PATCH /api/v1/datasets/:id`.
- El dataset cambia a status `ready` y el usuario es redirigido al Dashboard del dataset.

Reglas de Negocio:
- **Paso 2 - Mapping:**
  - Al menos 1 columna debe ser seleccionada como "Dimensión" (Eje X).
  - Al menos 1 columna debe ser configurada como "KPI Numérico" (Eje Y).
  - Los KPIs pueden configurarse con 3 formatos: number, currency, percentage.
  - Si existe una columna de tipo "fecha", puede marcarse para habilitar gráficos de series temporales.
  - Las columnas categóricas (texto no numérico) se identifican para uso futuro en filtros.

- **Paso 3 - Configuration:**
  - El nombre del report es obligatorio (min 1 carácter, máximo 100 caracteres).
  - El campo "descripción" existe en el modelo de datos pero se mantiene como opcional en la UI para no complicar el proceso.
  - El prompt de IA solo es accesible si la feature flag `VITE_FEATURE_AI_ENABLED=true` en el Frontend.
  - Si el prompt de IA está habilitado y el usuario lo proporciona, máximo 500 caracteres.
  - El resumen debe mostrar:
    - Tarjetas separadas para Archivo A y Archivo B con badges de cantidad de filas
    - Métricas totales del dataset unificado (suma de filas, campo dimensión, campo fecha, cantidad de KPIs)
    - Lista de KPIs configurados con sus etiquetas y formatos
  - El botón "Finalizar" debe estar deshabilitado hasta que el nombre del report sea válido.
  - Máximo 4 KPIs pueden ser destacados como "KPI Cards" en el dashboard (highlightedKpis en dashboardLayout).

- **Auto-asignación de Template:**
  - El sistema asigna automáticamente el template `sideby_executive` (KPI Cards + 1 Gráfico Principal + Tabla Resumen).

- **Validaciones Backend:**
  - Solo el propietario del dataset (ownerId) puede actualizar la configuración.
  - Todas las validaciones de campos (nombre, dimensión, KPIs, prompt IA) se realizan en el Backend mediante Zod schemas.

- **Testing (TDD Obligatorio):**
  - **Backend:** Tests unitarios deben verificar todas las validaciones (nombre vacío, dimensión faltante, exceso de KPIs destacados, prompt IA demasiado largo).
  - **Frontend:** Tests de componentes deben verificar:
    - ColumnMappingStep: Validación de dimensión/KPI, funcionalidad de añadir/remover KPIs
    - ConfigurationStep: Validación de nombre, visibilidad del prompt IA según feature flag, cálculo correcto del resumen, habilitación del botón "Finalizar"

Datos a Guardar (Schema de Dataset - actualizado):

```json
{
  "_id": "ObjectId('...')",
  "ownerId": "ObjectId('...')",
  "status": "ready",  // Cambia de "processing" a "ready" al completar el wizard
  
  // PASO 3: Metadata
  "meta": {
    "name": "Q1 2024 vs Q1 2023 - Ventas",  // Obligatorio
    "description": "",  // Opcional, oculto en UI
    "createdAt": "2024-01-26T10:00:00Z"
  },

  "sourceConfig": {
    "groupA": {
      "label": "Año Actual (2024)",
      "color": "#2563EB",
      "originalFileName": "ventas_2024.csv"
    },
    "groupB": {
      "label": "Año Anterior (2023)",
      "color": "#F97316",
      "originalFileName": "ventas_2023.csv"
    }
  },

  // PASO 2: El Mapeo
  "schemaMapping": {
    "dimensionField": "fecha",  // Columna seleccionada como Eje X
    "dateField": "fecha",  // (Opcional) Columna de fecha si aplica
    "kpiFields": [
      {
        "id": "kpi_1234567890",  // ID único generado
        "columnName": "ingresos",  // Nombre de columna del CSV
        "label": "Ingresos Totales",  // Label amigable del usuario
        "format": "currency"  // number | currency | percentage
      },
      {
        "id": "kpi_0987654321",
        "columnName": "visitas",
        "label": "Tráfico Web",
        "format": "number"
      }
    ],
    "categoricalFields": ["pais", "canal"]  // Columnas categóricas identificadas
  },

  // Template Auto-asignado
  "dashboardLayout": {
    "templateId": "sideby_executive",
    "highlightedKpis": ["kpi_1234567890", "kpi_0987654321"],  // Máximo 4
    "rows": [
      // Configuración de widgets (se define en RFC-004 Dashboard)
    ]
  },

  // PASO 3: Configuración de IA (Feature Flag)
  "aiConfig": {
    "enabled": true,  // Si el usuario habilitó IA
    "userContext": "Analiza esto como un CFO optimizando costos",  // Prompt opcional
    "lastAnalysis": null  // Cache del resultado de la IA (se llena después)
  },

  // Datos unificados (de RFC-001)
  "data": [
    {
      "fecha": "2024-01-01",
      "pais": "España",
      "ingresos": 1500,
      "visitas": 300,
      "_source_group": "groupA"
    },
    {
      "fecha": "2024-01-01",
      "pais": "España",
      "ingresos": 1200,
      "visitas": 280",
      "_source_group": "groupB"
    }
    // ...
  ]
}
```

**Referencia RFC:** [RFC-003-SCHEMA_MAPPING.md](./design/RFC-003-SCHEMA_MAPPING.md)
**Componentes Frontend:**
- `apps/client/src/features/dataset/components/wizard/ColumnMappingStep.tsx`
- `apps/client/src/features/dataset/components/wizard/ConfigurationStep.tsx`
**Referencia Visual:**
- DataMappingWizard: `SideBy-Design/src/pages/DataMappingWizard.tsx`
- DataFinishWizard: `SideBy-Design/src/pages/DataFinishWizard.tsx`

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