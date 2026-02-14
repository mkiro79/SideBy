/**
 * useDatasets Hook - Lógica de negocio para gestión de datasets
 *
 * Migrado a React Query para cache automático y sincronización.
 * Reemplaza implementación manual con useState/useEffect.
 *
 * Custom hook simplificado que expone directamente la query de React Query.
 * La lógica de navegación se maneja en los componentes (ej: DatasetsList.tsx).
 *
 * Sigue el patrón de "thin hooks" recomendado por React Query:
 * - El hook solo es un wrapper de useQuery
 * - Los componentes deciden cómo usar los datos
 * - La navegación es responsabilidad del componente
 */

import { useQuery } from "@tanstack/react-query";
import { listDatasets } from "../services/datasets.api.js";

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook para obtener la lista de datasets del usuario autenticado.
 *
 * Utiliza React Query para cache automático, revalidación y sincronización.
 *
 * @returns React Query result con lista de datasets
 *
 * @example
 * ```tsx
 * const { data: datasets = [], isLoading, error, refetch } = useDatasets();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * return <DatasetGrid datasets={datasets} onRefresh={refetch} />;
 * ```
 */
export const useDatasets = () => {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const response = await listDatasets();
      return response.data; // Extraer array de datasets del response
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (lista cambia frecuentemente)
  });
};
