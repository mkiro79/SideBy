/**
 * Dataset Service (Mock) - Servicio mock para gestión de datasets
 *
 * Este servicio simula llamadas a API con datos fake.
 * Los métodos están preparados para ser reemplazados por implementaciones reales.
 *
 * @module datasetService
 */

import type {
  Dataset,
  CreateDatasetDto,
  UpdateDatasetDto,
} from "../types/dataset.types.js";

// ============================================================================
// MOCK DATA - Datos de ejemplo para desarrollo
// ============================================================================

const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "Q1 2024 vs Q1 2023 - Marketing",
    description: "Comparativa de métricas de marketing entre trimestres",
    fileA: "ventas_2024.csv",
    fileB: "ventas_2023.csv",
    createdAt: "2024-01-20",
    kpis: ["Ventas", "Clicks", "ROI"],
    rowCount: 2404,
  },
  {
    id: "2",
    name: "Rendimiento Anual - Ventas",
    description: "Análisis año contra año del departamento de ventas",
    fileA: "sales_2024.xlsx",
    fileB: "sales_2023.xlsx",
    createdAt: "2024-01-18",
    kpis: ["Revenue", "Units", "Margin"],
    rowCount: 5620,
  },
  {
    id: "3",
    name: "Campaña Black Friday",
    description: "Comparativa Black Friday 2024 vs 2023",
    fileA: "bf_2024.csv",
    fileB: "bf_2023.csv",
    createdAt: "2024-01-15",
    kpis: ["Conversiones", "CPA", "ROAS"],
    rowCount: 892,
  },
];

// Simular persistencia en memoria durante la sesión
let datasets = [...mockDatasets];

// ============================================================================
// SERVICE METHODS
// ============================================================================

/**
 * Obtiene la lista completa de datasets del usuario
 * @returns Promise<Dataset[]>
 */
export const getDatasets = async (): Promise<Dataset[]> => {
  console.log("📊 [MOCK] getDatasets() - Obteniendo lista de datasets");

  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [...datasets];
};

/**
 * Obtiene un dataset específico por ID
 * @param id - ID del dataset
 * @returns Promise<Dataset | null>
 */
export const getDatasetById = async (id: string): Promise<Dataset | null> => {
  console.log(`📊 [MOCK] getDatasetById(${id}) - Obteniendo dataset`);

  await new Promise((resolve) => setTimeout(resolve, 300));

  const dataset = datasets.find((d) => d.id === id);
  return dataset || null;
};

/**
 * Crea un nuevo dataset
 * @param data - Datos del nuevo dataset
 * @returns Promise<Dataset>
 */
export const createDataset = async (
  data: CreateDatasetDto,
): Promise<Dataset> => {
  console.log("📊 [MOCK] createDataset() - Creando nuevo dataset:", data);
  console.log("⚠️ [PENDIENTE] Implementar endpoint POST /api/datasets");

  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simular creación
  const newDataset: Dataset = {
    id: Date.now().toString(),
    name: data.name,
    description: data.description,
    fileA: data.fileA.name,
    fileB: data.fileB.name,
    createdAt: new Date().toISOString(),
    kpis: [],
    rowCount: 0,
  };

  datasets.push(newDataset);

  return newDataset;
};

/**
 * Actualiza un dataset existente
 * @param data - Datos a actualizar
 * @returns Promise<Dataset>
 */
export const updateDataset = async (
  data: UpdateDatasetDto,
): Promise<Dataset> => {
  console.log(
    `📊 [MOCK] updateDataset(${data.id}) - Actualizando dataset:`,
    data,
  );
  console.log("⚠️ [PENDIENTE] Implementar endpoint PATCH /api/datasets/:id");

  await new Promise((resolve) => setTimeout(resolve, 600));

  const index = datasets.findIndex((d) => d.id === data.id);
  if (index === -1) {
    throw new Error(`Dataset con ID ${data.id} no encontrado`);
  }

  datasets[index] = {
    ...datasets[index],
    ...data,
  };

  return datasets[index];
};

/**
 * Elimina un dataset por ID
 * @param id - ID del dataset a eliminar
 * @returns Promise<boolean>
 */
export const deleteDataset = async (id: string): Promise<boolean> => {
  console.log(`🗑️ [MOCK] deleteDataset(${id}) - Eliminando dataset`);
  console.log("⚠️ [PENDIENTE] Implementar endpoint DELETE /api/datasets/:id");

  await new Promise((resolve) => setTimeout(resolve, 400));

  const initialLength = datasets.length;
  datasets = datasets.filter((d) => d.id !== id);

  return datasets.length < initialLength;
};

/**
 * Reinicia los datos mock a su estado inicial
 * Útil para testing
 */
export const resetMockData = (): void => {
  console.log("🔄 [MOCK] resetMockData() - Reiniciando datos mock");
  datasets = [...mockDatasets];
};
