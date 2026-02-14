/**
 * Data Upload Wizard Page
 * 
 * Wizard de 3 pasos para cargar y configurar datasets comparativos.
 * 
 * FLUJO 2-PHASE (RFC-003):
 * - FASE 1 (Step 1): Upload archivos → POST /datasets → Obtener datasetId
 * - FASE 2 (Step 3): Configurar mapping → PATCH /datasets/:id → status='ready'
 * 
 * @updated 2026-02-13 - Refactored for 2-phase API integration
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SidebarProvider } from '@/shared/components/ui/sidebar.js';
import { AppSidebar } from '@/shared/components/AppSidebar.js';
import { Button } from '@/shared/components/ui/button.js';
import { Card } from '@/shared/components/ui/card.js';
import { Separator } from '@/shared/components/ui/Separator.js';
import { toast } from '@/shared/services/toast.js';
import { useWizardState } from '../hooks/useWizardState.js';
import { useDatasetUpload } from '../hooks/useDatasetUpload.js';
import { useDatasetMapping } from '../hooks/useDatasetMapping.js';
import { StepIndicator } from '../components/wizard/StepIndicator.js';
import { FileUploadStep } from '../components/wizard/FileUploadStep.js';
import { ColumnMappingStep } from '../components/wizard/ColumnMappingStep.simplified.js';
import { ConfigurationStep } from '../components/wizard/ConfigurationStep.js';
import type { StepStatus } from '../types/wizard.types.js';
import type { UpdateMappingRequest } from '../types/api.types.js';

export default function DataUploadWizard() {
  const navigate = useNavigate();
  
  // Wizard state (Zustand)
  const {
    currentStep,
    datasetId,
    fileA,
    fileB,
    mapping,
    metadata,
    aiConfig,
    isLoading,
    nextStep,
    prevStep,
    reset,
    setDatasetId,
    setLoading,
    setError,
    canProceedToStep2,
    canProceedToStep3,
    canSubmit,
  } = useWizardState();
  
  // API hooks
  const { upload, isLoading: isUploading } = useDatasetUpload();
  const { update, isLoading: isUpdating } = useDatasetMapping();
  
  // Loading unificado
  const isBusy = isLoading || isUploading || isUpdating;
  
  /**
   * Calcula el status de un step
   */
  const getStepStatus = (stepNumber: number): 'current' | 'complete' | 'upcoming' => {
    if (currentStep === stepNumber) return 'current';
    if (currentStep > stepNumber) return 'complete';
    return 'upcoming';
  };

  /**
   * Define los pasos del wizard
   */
  const steps: StepStatus[] = [
    {
      id: 1,
      name: 'Carga de archivos',
      status: getStepStatus(1),
    },
    {
      id: 2,
      name: 'Mapeo de columnas',
      status: getStepStatus(2),
    },
    {
      id: 3,
      name: 'Configuración',
      status: getStepStatus(3),
    },
  ];
  
  /**
   * FASE 1: Upload archivos (Step 1 → Step 2)
   * POST /api/v1/datasets - Crea dataset en estado 'processing'
   */
  const handleFileUpload = async () => {
    if (!canProceedToStep2()) {
      toast.warning('Archivos incompletos', 'Debes cargar ambos archivos antes de continuar');
      return;
    }
    
    if (!fileA.file || !fileB.file) {
      toast.error('Error', 'No se encontraron los archivos');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await upload({
        fileA: fileA.file,
        fileB: fileB.file,
      });
      
      // Guardar datasetId para FASE 2
      setDatasetId(result.datasetId);
      
      toast.success('Archivos subidos exitosamente', `${result.rowCount} filas procesadas`);
      
      // Avanzar a Step 2 (Mapping)
      nextStep();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al subir archivos', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * FASE 2: Configurar mapping (Step 3 → Dashboard)
   * PATCH /api/v1/datasets/:id - Actualiza dataset a estado 'ready'
   */
  const handleConfigureMapping = async () => {
    if (!datasetId) {
      toast.error('Error', 'No se encontró el dataset. Por favor, sube los archivos nuevamente.');
      return;
    }
    
    if (!canSubmit()) {
      toast.error('Configuración incompleta', 'Completa todos los campos obligatorios');
      return;
    }
    
    setLoading(true);
    
    try {
      // Construir payload de configuración
      const payload: UpdateMappingRequest = {
        meta: {
          name: metadata.name,
          description: metadata.description || undefined,
        },
        schemaMapping: {
          dimensionField: mapping.dimensionField || '',
          dateField: mapping.dateField || undefined,
          kpiFields: (mapping.kpiFields || []).map((kpi) => ({
            id: kpi.id,
            columnName: kpi.columnName,
            label: kpi.label,
            format: kpi.format as 'number' | 'currency' | 'percentage',
          })),
          categoricalFields: mapping.categoricalFields as string[] | undefined,
        },
        dashboardLayout: {
          templateId: 'sideby_executive',
          highlightedKpis: (mapping.kpiFields || [])
            .filter((kpi) => kpi.highlighted)
            .map((kpi) => kpi.columnName),
        },
        aiConfig: aiConfig.enabled
          ? {
              enabled: true,
              userContext: aiConfig.userContext || undefined,
            }
          : undefined,
      };
      
      await update(datasetId, payload);
      
      toast.success('Dataset configurado exitosamente', 'Redirigiendo al dashboard...');
      
      // Reset wizard state
      reset();
      
      // Navegar al dashboard del dataset
      navigate(`/datasets/${datasetId}/dashboard`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al configurar el dataset', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handler para avanzar al siguiente step
   * Step 1→2: Valida archivos pero NO hace upload (manual con botón "Continuar")
   * Step 2→3: Valida mapping
   */
  const handleNext = () => {
    if (currentStep === 1 && !canProceedToStep2()) {
      toast.warning('Archivos incompletos', 'Debes cargar ambos archivos antes de continuar');
      return;
    }
    
    if (currentStep === 2 && !canProceedToStep3()) {
      toast.warning('Mapeo incompleto', 'Debes seleccionar al menos una métrica para continuar');
      return;
    }
    
    nextStep();
  };
  
  /**
   * Handler para cancelar
   */
  const handleCancel = () => {
    if (currentStep > 1) {
      // Confirmar si ya avanzó pasos
      const userConfirmed = globalThis.confirm(
        '¿Estás seguro de que quieres cancelar? Perderás todo el progreso.'
      );
      if (!userConfirmed) return;
    }
    
    reset();
    navigate('/datasets');
  };
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl mx-auto py-8 px-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Nuevo dataset</h1>
                <p className="text-muted-foreground mt-1">
                  Importa datos comparativos para análisis
                </p>
              </div>
              
              <Button variant="ghost" onClick={handleCancel} disabled={isBusy}>
                Cancelar
              </Button>
            </div>
            
            <Separator />
            
            {/* Step Indicator */}
            <StepIndicator steps={steps} currentStep={currentStep} />
            
            {/* Step Content */}
            <Card className="p-8">
              {currentStep === 1 && <FileUploadStep />}
              {currentStep === 2 && <ColumnMappingStep />}
              {currentStep === 3 && <ConfigurationStep />}
            </Card>
            
            {/* Navigation Footer */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isBusy}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {' '}
                Anterior
              </Button>
              
              {currentStep === 1 ? (
                <Button
                  onClick={handleFileUpload}
                  disabled={isBusy || !canProceedToStep2()}
                >
                  {isUploading ? 'Subiendo...' : 'Subir archivos'}
                  {' '}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : currentStep === 2 ? (
                <Button
                  onClick={handleNext}
                  disabled={isBusy || !canProceedToStep3()}
                >
                  Siguiente
                  {' '}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleConfigureMapping}
                  disabled={isBusy || !canSubmit()}
                >
                  {isUpdating ? (
                    'Creando dataset...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {' '}
                      Crear dataset
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
