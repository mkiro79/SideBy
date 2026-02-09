/**
 * useDatasets Hook - Lógica de negocio para gestión de datasets
 *
 * Custom hook que maneja:
 * - Fetching de la lista de datasets
 * - Estado de carga y errores
 * - Eliminación de datasets
 * - Navegación a creación/dashboard
 *
 * Sigue el patrón Smart Component (este hook) + Dumb Component (DatasetsList UI)
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Dataset } from "../types/dataset.types.js";
import * as datasetService from "../services/datasetService.mock.js";

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseDatasetsReturn {
  datasets: Dataset[];
  isLoading: boolean;
  error: string | null;
  deleteDataset: (id: string) => Promise<void>;
  openDataset: (id: string) => void;
  createNewDataset: () => void;
  refreshDatasets: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useDatasets = (): UseDatasetsReturn => {
  const navigate = useNavigate();

  // Estado local
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga la lista de datasets desde el servicio
   */
  const loadDatasets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await datasetService.getDatasets();
      setDatasets(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar datasets";
      setError(errorMessage);
      console.error("❌ Error loading datasets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Efecto inicial: cargar datasets al montar el componente
   */
  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  /**
   * Elimina un dataset por ID
   * @param id - ID del dataset a eliminar
   */
  const deleteDataset = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await datasetService.deleteDataset(id);

      if (success) {
        // Actualizar estado local eliminando el dataset
        setDatasets((prev) => prev.filter((dataset) => dataset.id !== id));
      } else {
        throw new Error("No se pudo eliminar el dataset");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar dataset";
      console.error("❌ Error deleting dataset:", err);
      // Opcional: Mostrar toast/notification al usuario
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Abre un dataset en el dashboard
   * @param id - ID del dataset a abrir
   */
  const openDataset = useCallback(
    (id: string): void => {
      console.log(`🚀 Navegando a dashboard con dataset: ${id}`);
      // Navegar al dashboard pasando el ID del dataset en el state
      navigate("/dashboard", { state: { datasetId: id } });
    },
    [navigate],
  );

  /**
   * Navega al wizard de creación de nuevo dataset
   */
  const createNewDataset = useCallback((): void => {
    console.log("➕ Navegando a creación de dataset");
    navigate("/datasets/upload");
  }, [navigate]);

  /**
   * Recarga manualmente la lista de datasets
   */
  const refreshDatasets = useCallback(async (): Promise<void> => {
    await loadDatasets();
  }, [loadDatasets]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    datasets,
    isLoading,
    error,
    deleteDataset,
    openDataset,
    createNewDataset,
    refreshDatasets,
  };
};
