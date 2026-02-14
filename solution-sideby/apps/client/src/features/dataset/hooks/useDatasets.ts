/**
 * useDatasets Hook - Lógica de negocio para gestión de datasets
 *
 * Migrado a React Query para cache automático y sincronización.
 * Reemplaza implementación manual con useState/useEffect.
 *
 * Custom hook que maneja:
 * - Fetching de la lista de datasets con cache automático
 * - Estado de carga y errores
 * - Eliminación de datasets
 * - Navegación a creación/dashboard
 *
 * Sigue el patrón Smart Component (este hook) + Dumb Component (DatasetsList UI)
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listDatasets } from "../services/datasets.api.js";
import { useDeleteDataset } from "./useDeleteDataset.js";
import type { DatasetSummary } from "../types/api.types.js";

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseDatasetsReturn {
  datasets: DatasetSummary[];
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

/**
 * Hook para gestionar la lista de datasets del usuario autenticado.
 *
 * Utiliza React Query para cache automático, revalidación y sincronización.
 *
 * @returns Hook state y funciones de navegación/mutación
 *
 * @example
 * ```tsx
 * const { datasets, isLoading, error, deleteDataset } = useDatasets();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * return <DatasetGrid datasets={datasets} onDelete={deleteDataset} />;
 * ```
 */
export const useDatasets = (): UseDatasetsReturn => {
  const navigate = useNavigate();
  const deleteMutation = useDeleteDataset();

  // Query para lista de datasets (React Query)
  const {
    data: datasetsResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["datasets"],
    queryFn: listDatasets,
    staleTime: 2 * 60 * 1000, // 2 minutos (lista cambia frecuentemente)
  });

  // Extraer datasets del response (API devuelve { data: DatasetSummary[] })
  const datasets: DatasetSummary[] = datasetsResponse?.data || [];
  const error = queryError ? queryError.message : null;

  /**
   * Elimina un dataset por ID
   * Delegado a useDeleteDataset que maneja cache y optimistic updates
   * @param id - ID del dataset a eliminar
   */
  const deleteDataset = useCallback(
    async (id: string): Promise<void> => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  /**
   * Abre un dataset en el dashboard
   * @param id - ID del dataset a abrir
   */
  const openDataset = useCallback(
    (id: string): void => {
      console.log(`🚀 Navegando a dashboard con dataset: ${id}`);
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
    await refetch();
  }, [refetch]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    datasets,
    isLoading,
    error: error || null,
    deleteDataset,
    openDataset,
    createNewDataset,
    refreshDatasets,
  };
};
