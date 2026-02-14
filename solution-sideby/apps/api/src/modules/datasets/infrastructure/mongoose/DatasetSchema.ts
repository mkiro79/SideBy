import mongoose, { Schema, type Document } from "mongoose";
import type {
  Dataset,
  DatasetStatus,
} from "@/modules/datasets/domain/Dataset.entity.js";

/**
 * Interfaz TypeScript para el documento Mongoose.
 * Extiende Dataset pero usa _id de Mongoose en lugar de id.
 */
export interface DatasetDocument extends Omit<Dataset, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

/**
 * Schema de configuración de grupo (GroupConfig).
 * Usado para documentar los archivos originales subidos.
 */
const GroupConfigSchema = new Schema(
  {
    label: { type: String, required: true },
    color: { type: String, required: true },
    originalFileName: { type: String, required: true },
    rowCount: { type: Number, required: true, min: 0 },
  },
  { _id: false }, // No generar _id para subdocumentos
);

/**
 * Schema de campo KPI (KPIField).
 * Define cómo se visualiza y formatea cada métrica.
 */
const KPIFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    columnName: { type: String, required: true },
    label: { type: String, required: true },
    format: {
      type: String,
      enum: ["number", "currency", "percentage"],
      required: true,
    },
    highlighted: { type: Boolean, default: false }, // ✅ Campo opcional para KPIs destacados
  },
  { _id: false },
);

/**
 * Schema principal del Dataset.
 *
 * Índices:
 * - ownerId: Para búsquedas rápidas por usuario
 * - status + createdAt: Para el job de limpieza de datasets abandonados
 */
const DatasetSchema = new Schema<DatasetDocument>(
  {
    // === OWNERSHIP & STATUS ===
    ownerId: {
      type: String,
      required: true,
      index: true, // Índice para búsqueda rápida por usuario
    },
    status: {
      type: String,
      enum: ["processing", "ready", "error"] as DatasetStatus[],
      default: "processing",
      index: true, // Índice para filtrar por status
    },

    // === METADATA ===
    meta: {
      name: {
        type: String,
        required: false, // Opcional hasta que se complete el mapping
        maxlength: 100,
      },
      description: {
        type: String,
        maxlength: 500,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        immutable: true, // No debe cambiar después de creación
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // === SOURCE CONFIGURATION ===
    sourceConfig: {
      groupA: {
        type: GroupConfigSchema,
        required: true,
      },
      groupB: {
        type: GroupConfigSchema,
        required: true,
      },
    },

    // === SCHEMA MAPPING (opcional hasta Step 3) ===
    schemaMapping: {
      dimensionField: { type: String },
      dateField: { type: String },
      kpiFields: [KPIFieldSchema],
      categoricalFields: [{ type: String }],
    },

    // === DASHBOARD LAYOUT (opcional hasta Step 3) ===
    dashboardLayout: {
      templateId: { type: String },
      highlightedKpis: [{ type: String }],
    },

    // === AI CONFIGURATION (opcional) ===
    aiConfig: {
      enabled: { type: Boolean, default: false },
      userContext: { type: String, maxlength: 500 },
      lastAnalysis: { type: String, maxlength: 5000 },
    },

    // === DATA (filas unificadas con _source_group) ===
    data: [
      {
        type: Schema.Types.Mixed, // Flexible para aceptar cualquier estructura de CSV
      },
    ],
  },
  {
    timestamps: false, // Usamos nuestro propio meta.createdAt y meta.updatedAt
    collection: "datasets",
  },
);

// === ÍNDICES COMPUESTOS ===

/**
 * Índice compuesto para el job de limpieza.
 * Permite buscar datasets en "processing" más antiguos que X horas.
 */
DatasetSchema.index({ status: 1, "meta.createdAt": 1 });

/**
 * Índice para búsquedas combinadas de usuario + status.
 * Útil para filtrar datasets por estado en la UI.
 */
DatasetSchema.index({ ownerId: 1, status: 1 });

// === MÉTODOS DE INSTANCIA (si se necesitan) ===

/**
 * Verifica si el dataset pertenece a un usuario específico.
 */
DatasetSchema.methods.isOwnedBy = function (userId: string): boolean {
  return this.ownerId === userId;
};

/**
 * Verifica si el dataset está listo para ser usado.
 */
DatasetSchema.methods.isReady = function (): boolean {
  return (
    this.status === "ready" && !!this.schemaMapping && !!this.dashboardLayout
  );
};

/**
 * Obtiene el número total de filas de ambos grupos.
 */
DatasetSchema.methods.getTotalRowCount = function (): number {
  return this.data?.length || 0;
};

// === MODELO ===

/**
 * Modelo Mongoose para Dataset.
 * Usado por MongoDatasetRepository para interactuar con MongoDB.
 */
export const DatasetModel = mongoose.model<DatasetDocument>(
  "Dataset",
  DatasetSchema,
);
