/**
 * useDatasetsList Hook
 *
 * Custom hook para cargar la lista de todos los datasets del usuario.
 * Carga automáticamente los datos cuando se monta el componente.
 *
 * @returns {object} Hook state y funciones
 * @returns {DatasetSummary[]} datasets - Lista de datasets (sin campo 'data')
 * @returns {number} total - Total de datasets del usuario
 * @returns {boolean} isLoading - Estado de carga
 * @returns {string | null} error - Mensaje de error (si existe)
 * @returns {Function} reload - Recargar lista manualmente
 *
 * @example
 * ```tsx
 * const { datasets, total, isLoading, error, reload } = useDatasetsList();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <div>
 *     <h2>Datasets ({total})</h2>
 *     <button onClick={reload}>Recargar</button>
 *     {datasets.map(dataset => <DatasetCard key={dataset.id} {...dataset} />)}
 *   </div>
 * );
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { listDatasets } from "../services/datasets.api.js";
import type { DatasetSummary } from "../types/api.types.js";

export function useDatasetsList() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga la lista de datasets desde el backend
   */
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listDatasets();
      setDatasets(response.data);
      setTotal(response.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recarga la lista de datasets manualmente
   */
  const reload = useCallback(() => {
    load();
  }, [load]);

  /**
   * Efecto: Cargar lista al montar el componente
   */
  useEffect(() => {
    load();
  }, [load]);

  return {
    datasets,
    total,
    isLoading,
    error,
    reload,
  };
}
