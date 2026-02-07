/**
 * Data Upload Wizard Page
 * 
 * Wizard de 3 pasos para cargar y configurar datasets comparativos
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
import { uploadDataset } from '../services/datasetUpload.mock.js';
import { unifyDatasets } from '../utils/csvParser.js';
import { StepIndicator } from '../components/wizard/StepIndicator.js';
import { FileUploadStep } from '../components/wizard/FileUploadStep.js';
import { ColumnMappingStep } from '../components/wizard/ColumnMappingStep.js';
import { ConfigurationStep } from '../components/wizard/ConfigurationStep.js';
import type { StepStatus, CreateDatasetPayload } from '../types/wizard.types.js';

export default function DataUploadWizard() {
  const navigate = useNavigate();
  
  const {
    currentStep,
    fileA,
    fileB,
    mapping,
    metadata,
    aiConfig,
    isLoading,
    nextStep,
    prevStep,
    reset,
    setLoading,
    setError,
    canProceedToStep2,
    canProceedToStep3,
    canSubmit,
  } = useWizardState();
  
  /**
   * Define los pasos del wizard
   */
  const steps: StepStatus[] = [
    {
      id: 1,
      name: 'Carga de archivos',
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'complete' : 'upcoming',
    },
    {
      id: 2,
      name: 'Mapeo de columnas',
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'complete' : 'upcoming',
    },
    {
      id: 3,
      name: 'Configuración',
      status: currentStep === 3 ? 'current' : 'upcoming',
    },
  ];
  
  /**
   * Handler para siguiente paso
   */
  const handleNext = () => {
    if (currentStep === 1 && !canProceedToStep2()) {
      toast.warning('Archivos incompletos', 'Debes cargar ambos archivos antes de continuar');
      return;
    }
    
    if (currentStep === 2 && !canProceedToStep3()) {
      toast.warning('Mapeo incompleto', 'Debes configurar al menos un campo KPI');
      return;
    }
    
    nextStep();
  };
  
  /**
   * Handler para enviar el wizard
   */
  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast.error('Configuración incompleta', 'Completa todos los campos obligatorios');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Unificar datos
      const unifiedData = unifyDatasets(
        fileA.parsedData!,
        fileB.parsedData!,
        mapping.dimensionField!
      );
      
      // Crear payload
      const payload: CreateDatasetPayload = {
        name: metadata.name,
        description: metadata.description || undefined,
        fileA: fileA.file!,
        fileB: fileB.file!,
        mapping: {
          dimensionField: mapping.dimensionField!,
          kpiFields: mapping.kpiFields.map((kpi) => ({
            id: kpi.id,
            sourceColumn: kpi.columnName,
            label: kpi.label,
            type: kpi.format,
            aggregation: 'sum' as const,
            format: kpi.format,
          })),
        },
        aiConfig: aiConfig.enabled
          ? {
              enabled: true,
              userContext: aiConfig.userContext || undefined,
            }
          : undefined,
        unifiedData,
      };
      
      // Hacer upload (promesa con toast)
      const dataset = await toast.promise(uploadDataset(payload), {
        loading: 'Creando dataset...',
        success: 'Dataset creado exitosamente',
        error: 'Error al crear el dataset',
      });
      
      console.log('✅ Dataset creado:', dataset);
      
      // Reset y navegar
      reset();
      navigate('/datasets');
      
    } catch (error: unknown) {
      console.error('❌ Error en handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handler para cancelar
   */
  const handleCancel = () => {
    if (currentStep > 1) {
      // Confirmar si ya avanzó pasos
      const confirm = window.confirm(
        '¿Estás seguro de que quieres cancelar? Perderás todo el progreso.'
      );
      if (!confirm) return;
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
              
              <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
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
                disabled={currentStep === 1 || isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    isLoading ||
                    (currentStep === 1 && !canProceedToStep2()) ||
                    (currentStep === 2 && !canProceedToStep3())
                  }
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || isLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Crear dataset
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
