/**
 * useDataset Hook - Query para dataset individual
 *
 * Migrado a React Query para cache automático y sincronización.
 *
 * Custom hook para cargar un dataset completo por su ID.
 * Carga automáticamente los datos cuando se monta el componente
 * o cuando cambia el datasetId.
 *
 * @param datasetId - ID del dataset a cargar (o null para deshabilitar)
 * @returns Query object con dataset completo
 *
 * @example
 * ```tsx
 * const { data: dataset, isLoading, error, refetch } = useDataset(id);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!dataset) return null;
 *
 * return <DashboardView dataset={dataset} onRefresh={refetch} />;
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { getDataset } from "../services/datasets.api.js";

/**
 * Hook para cargar un dataset individual por ID con React Query.
 *
 * @param datasetId - ID del dataset o null para deshabilitar la query
 * @returns Query object con dataset, loading, error, refetch
 */
export function useDataset(datasetId: string | null) {
  const query = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: () => getDataset(datasetId!),
    enabled: !!datasetId, // Solo ejecutar si hay ID
    staleTime: 5 * 60 * 1000, // 5 minutos (detalle cambia menos frecuentemente)
  });

  // Wrapper para reload que respeta el enabled flag
  const reload = () => {
    if (datasetId) {
      return query.refetch();
    }
    // Si no hay datasetId, retornar promesa compatible (nunca se usa realmente)
    return Promise.resolve(
      undefined as unknown as Awaited<ReturnType<typeof query.refetch>>,
    );
  };

  return {
    dataset: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    reload,
  };
}
