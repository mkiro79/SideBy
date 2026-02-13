/**
 * useDataset Hook
 *
 * Custom hook para cargar un dataset completo por su ID.
 * Carga automáticamente los datos cuando se monta el componente
 * o cuando cambia el datasetId.
 *
 * @param datasetId - ID del dataset a cargar (o null)
 * @returns {object} Hook state y funciones
 * @returns {Dataset | null} dataset - Datos del dataset cargado
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string | null} error - Mensaje de error (si existe)
 * @returns {Function} reload - Recargar dataset manualmente
 *
 * @example
 * ```tsx
 * const { dataset, isLoading, error, reload } = useDataset(datasetId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * if (!dataset) return null;
 *
 * return <DashboardView dataset={dataset} onRefresh={reload} />;
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { getDataset } from "../services/datasets.api.js";
import type { Dataset } from "../types/api.types.js";

export function useDataset(datasetId: string | null) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga el dataset desde el backend
   */
  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDataset(id);
      setDataset(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recarga el dataset manualmente
   */
  const reload = useCallback(() => {
    if (datasetId) {
      load(datasetId);
    }
  }, [datasetId, load]);

  /**
   * Efecto: Cargar dataset cuando cambia el datasetId
   */
  useEffect(() => {
    if (datasetId) {
      load(datasetId);
    }
  }, [datasetId, load]);

  return {
    dataset,
    isLoading,
    error,
    reload,
  };
}
