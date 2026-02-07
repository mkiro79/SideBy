/**
 * DatasetsList Page - Página de listado de datasets
 * 
 * Página principal que muestra todos los datasets del usuario.
 * Permite crear nuevos, abrir existentes y eliminarlos.
 * 
 * Arquitectura:
 * - Uso del custom hook useDatasets() para lógica de negocio
 * - Componentes presentacionales: DatasetCard, EmptyDatasets
 * - Layout con Sidebar de navegación
 * 
 * Estilos adaptados a variables CSS de Tailwind 4
 */

import { SidebarProvider } from "@/shared/components/ui/sidebar.js";
import { AppSidebar } from "@/shared/components/AppSidebar.js";
import { Button } from "@/shared/components/ui/button.js";
import { Plus } from "lucide-react";
import { useDatasets } from "../hooks/useDatasets.js";
import { DatasetCard } from "../components/DatasetCard.js";
import { EmptyDatasets } from "../components/EmptyDatasets.js";

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export const DatasetsList = () => {
  const {
    datasets,
    isLoading,
    error,
    deleteDataset,
    openDataset,
    createNewDataset,
  } = useDatasets();

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
              <Button onClick={createNewDataset} className="gap-2">
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
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
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
                  <EmptyDatasets onCreateNew={createNewDataset} />
                ) : (
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <DatasetCard
                        key={dataset.id}
                        dataset={dataset}
                        onOpen={openDataset}
                        onDelete={deleteDataset}
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
