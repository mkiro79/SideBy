/**
 * Estado del procesamiento de un dataset.
 * - processing: El dataset está siendo procesado (archivos subidos pero no configurado)
 * - ready: El dataset está listo para ser usado (mapping configurado)
 * - error: Hubo un error en el procesamiento
 */
export type DatasetStatus = "processing" | "ready" | "error";

/**
 * Identificador de grupo para diferenciar las fuentes de datos.
 * - groupA: Primer archivo/grupo (ej. datos actuales, año 2024)
 * - groupB: Segundo archivo/grupo (ej. datos históricos, año 2023)
 */
export type SourceGroup = "groupA" | "groupB";

/**
 * Formato de visualización para los campos KPI.
 */
export type KPIFormat = "number" | "currency" | "percentage";

/**
 * Configuración de cada grupo de datos (A o B).
 * Almacena metadata sobre el archivo original y su presentación.
 */
export interface GroupConfig {
  /** Etiqueta personalizada del grupo (ej. "Ventas 2024") */
  label: string;
  /** Color hexadecimal para visualización (ej. "#3b82f6") */
  color: string;
  /** Nombre del archivo original subido */
  originalFileName: string;
  /** Número de filas en este grupo */
  rowCount: number;
}

/**
 * Definición de un campo KPI (Key Performance Indicator).
 * Los KPIs son métricas numéricas que se pueden comparar entre grupos.
 */
export interface KPIField {
  /** Identificador único del KPI (ej. "kpi_1234567890") */
  id: string;
  /** Nombre de la columna en el CSV original */
  columnName: string;
  /** Etiqueta amigable para mostrar al usuario */
  label: string;
  /** Formato de visualización (número, moneda, porcentaje) */
  format: KPIFormat;
  /** Si el KPI debe destacarse en el dashboard (opcional, max 4) */
  highlighted?: boolean;
}

/**
 * Fila de datos unificada.
 * Cada fila contiene un campo especial _source_group que identifica
 * de qué archivo/grupo proviene, permitiendo comparaciones.
 */
export interface DataRow {
  /** Identificador de origen: groupA o groupB */
  _source_group: SourceGroup;
  /** Propiedades dinámicas según las columnas del CSV */
  [key: string]: string | number | boolean;
}

/**
 * Configuración del esquema de mapping.
 * Define cómo se interpretan y visualizan los datos del CSV.
 */
export interface SchemaMapping {
  /** Campo que actúa como dimensión principal (ej. "fecha", "producto") */
  dimensionField: string;
  /** Campo de fecha opcional para gráficos temporales */
  dateField?: string;
  /** Lista de KPIs configurados para comparación */
  kpiFields: KPIField[];
  /** Campos categóricos para filtrado (opcional) */
  categoricalFields?: string[];
}

/**
 * Configuración del layout del dashboard.
 * Define cómo se presenta la información en la UI.
 */
export interface DashboardLayout {
  /** Identificador de la plantilla de dashboard */
  templateId: "sideby_executive";
  /** IDs de los KPIs destacados (máximo 4) */
  highlightedKpis: string[];
}

/**
 * Configuración de inteligencia artificial.
 * Controla las capacidades de análisis asistido por IA.
 */
export interface AIConfig {
  /** Si el análisis con IA está habilitado */
  enabled: boolean;
  /** Flags granulares por funcionalidad de IA */
  enabledFeatures?: {
    insights?: boolean;
  };
  /** Contexto del usuario para personalizar análisis */
  userContext?: string;
  /** Último análisis generado por IA */
  lastAnalysis?: string;
}

/**
 * Metadata del dataset.
 * Información básica de identificación y modificación.
 */
export interface DatasetMetadata {
  /** Nombre descriptivo del dataset */
  name: string;
  /** Descripción opcional del dataset */
  description?: string;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de última actualización */
  updatedAt: Date;
}

/**
 * Entidad principal del módulo Datasets.
 *
 * Representa un dataset comparativo con dos fuentes de datos (groupA y groupB).
 * Sigue el principio de Clean Architecture: es una entidad pura de TypeScript
 * sin dependencias de frameworks o herramientas externas.
 *
 * @example
 * ```typescript
 * const dataset: Dataset = {
 *   id: "507f1f77bcf86cd799439011",
 *   ownerId: "user_123",
 *   status: "processing",
 *   meta: {
 *     name: "Ventas Q1 2024 vs 2023",
 *     description: "Comparación trimestral",
 *     createdAt: new Date(),
 *     updatedAt: new Date()
 *   },
 *   sourceConfig: {
 *     groupA: { label: "2024", color: "#3b82f6", originalFileName: "q1_2024.csv", rowCount: 1500 },
 *     groupB: { label: "2023", color: "#6366f1", originalFileName: "q1_2023.csv", rowCount: 1200 }
 *   },
 *   data: [
 *     { _source_group: "groupA", fecha: "2024-01-01", ventas: 10000 },
 *     { _source_group: "groupB", fecha: "2023-01-01", ventas: 9000 }
 *   ]
 * };
 * ```
 */
export interface Dataset {
  /** Identificador único del dataset */
  id: string;
  /** ID del usuario propietario (de JWT) */
  ownerId: string;
  /** Estado de procesamiento del dataset */
  status: DatasetStatus;
  /** Metadata descriptiva */
  meta: DatasetMetadata;
  /** Configuración de los dos grupos de datos */
  sourceConfig: {
    groupA: GroupConfig;
    groupB: GroupConfig;
  };
  /** Configuración del mapping de datos (opcional hasta Step 3) */
  schemaMapping?: SchemaMapping;
  /** Configuración del layout del dashboard (opcional hasta Step 3) */
  dashboardLayout?: DashboardLayout;
  /** Configuración de IA (opcional) */
  aiConfig?: AIConfig;
  /** Datos unificados con tags _source_group */
  data: DataRow[];
}
