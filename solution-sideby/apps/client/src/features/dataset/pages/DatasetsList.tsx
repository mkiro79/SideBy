/**
 * DatasetsList Page - Página de listado de datasets
 * 
 * Página principal que muestra todos los datasets del usuario.
 * Permite crear nuevos, abrir existentes y eliminarlos.
 * 
 * Arquitectura:
 * - Uso de React Query hooks para lógica de negocio
 * - Componentes presentacionales: DatasetCard, EmptyDatasets
 * - Layout con Sidebar de navegación
 * - Optimistic updates en delete con rollback automático
 * 
 * Estilos adaptados a variables CSS de Tailwind 4
 */

import { SidebarProvider } from "@/shared/components/ui/sidebar.js";
import { AppSidebar } from "@/shared/components/AppSidebar.js";
import { Button } from "@/shared/components/ui/button.js";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDatasets } from "../hooks/useDatasets.js";
import { useDeleteDataset } from "../hooks/useDeleteDataset.js";
import { DatasetCard } from "../components/DatasetCard.js";
import { EmptyDatasets } from "../components/EmptyDatasets.js";

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export const DatasetsList = () => {
  const navigate = useNavigate();
  
  // ✅ React Query hooks
  const { data: datasetsResponse, isLoading, error, refetch } = useDatasets();
  const datasets = datasetsResponse?.data || [];
  const deleteMutation = useDeleteDataset();

  /**
   * Navega al dashboard de un dataset específico
   */
  const handleOpenDashboard = (id: string) => {
    navigate(`/datasets/${id}/dashboard`);
  };

  /**
   * Navega al wizard de creación de dataset
   */
  const handleCreateNew = () => {
    navigate('/datasets/upload');
  };

  /**
   * Elimina un dataset con optimistic update
   * El hook useDeleteDataset maneja:
   * - Actualización optimista del cache (desaparece instantáneamente)
   * - Rollback automático si falla la operación
   * - Invalidación del cache después del éxito
   * - Manejo de errores (error se expone vía deleteMutation.error)
   */
  const handleDelete = (id: string) => {
    // Usamos mutate (fire-and-forget) en lugar de mutateAsync
    // Los errores se exponen automáticamente vía deleteMutation.error
    deleteMutation.mutate(id);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl py-6 space-y-6">
            
            {/* ================================================================
                HEADER - Título y botón de crear
            ================================================================ */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Mis Datasets</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona tus datasets comparativos
                </p>
              </div>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Nuevo
              </Button>
            </div>

            {/* ================================================================
                ERROR STATE - Mostrar si hay error
            ================================================================ */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">
                  Error al cargar datasets
                </p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error.message || String(error)}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()} 
                  className="mt-3"
                >
                  Reintentar
                </Button>
              </div>
            )}

            {/* ================================================================
                LOADING STATE - Skeleton/spinner mientras carga
            ================================================================ */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-lg border bg-muted/20 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* ================================================================
                DATASETS LIST - Lista de datasets o estado vacío
            ================================================================ */}
            {!isLoading && !error && (
              <>
                {datasets.length === 0 ? (
                  <EmptyDatasets onCreateNew={handleCreateNew} />
                ) : (
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <DatasetCard
                        key={dataset.id}
                        dataset={dataset}
                        onOpen={handleOpenDashboard}
                        onDelete={handleDelete}
                        isDeleting={
                          deleteMutation.isPending &&
                          deleteMutation.variables === dataset.id
                          // variables es string (id del dataset), según la firma del mutation
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DatasetsList;
