/**
 * Dataset Upload Service (MOCK)
 *
 * Simula la llamada al API para crear un dataset.
 * REEMPLAZAR cuando el backend esté disponible.
 */

import type { CreateDatasetPayload } from "../types/wizard.types.js";
import type { Dataset } from "../types/dataset.types.js";

/**
 * Simula el upload de un dataset al servidor
 *
 * @param payload - Datos completos del dataset a crear
 * @returns Dataset creado con ID generado
 */
export async function uploadDataset(
  payload: CreateDatasetPayload,
): Promise<Dataset> {
  console.log("📤 [MOCK] uploadDataset called with payload:", {
    name: payload.name,
    description: payload.description,
    fileA: payload.fileA.name,
    fileB: payload.fileB.name,
    mapping: payload.mapping,
    aiConfig: payload.aiConfig,
    dataRows: payload.unifiedData.length,
  });

  // Simular delay de red (1.5 segundos)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simular error aleatorio (10% de probabilidad)
  if (Math.random() < 0.1) {
    throw new Error(
      "Error simulado del servidor: No se pudo procesar el archivo",
    );
  }

  // Crear dataset mockeado
  const mockDataset: Dataset = {
    id: `dataset_${Date.now()}`,
    name: payload.name,
    description: payload.description || "Dataset importado desde wizard",
    createdAt: new Date().toISOString(),
    fileA: payload.fileA.name,
    fileB: payload.fileB.name,
    kpis: payload.mapping.kpiFields.map((kpi) => kpi.label),
    rowCount: payload.unifiedData.length,
  };

  console.log("✅ [MOCK] Dataset created successfully:", mockDataset);

  return mockDataset;
}

/**
 * Simula la validación de nombres duplicados
 */
export async function checkDatasetNameExists(name: string): Promise<boolean> {
  console.log(`🔍 [MOCK] Checking if dataset name "${name}" exists...`);

  await new Promise((resolve) => setTimeout(resolve, 300));

  // Simular que algunos nombres ya existen
  const existingNames = ["Ventas 2024", "Inventario Q1", "Clientes Premium"];
  const exists = existingNames.some(
    (existing) => existing.toLowerCase() === name.toLowerCase(),
  );

  console.log(
    `✅ [MOCK] Name check result: ${exists ? "EXISTS" : "AVAILABLE"}`,
  );

  return exists;
}
