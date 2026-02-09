/**
 * File Upload Step Component
 * 
 * Paso 1 del wizard: carga de archivos A y B con drag & drop
 */

import { useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert.js';
import { Button } from '@/shared/components/ui/button.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { useFileUpload } from '../../hooks/useFileUpload.js';
import { useWizardState } from '../../hooks/useWizardState.js';
import { formatFileSize } from '../../utils/fileValidation.js';
import type { FileGroup } from '../../types/wizard.types.js';

export function FileUploadStep() {
  const { processFile, processFilePair, isProcessing } = useFileUpload();
  const { fileA, fileB, setFileA, setFileB, clearFiles } = useWizardState();
  
  /**
   * Handler para drop de archivos
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, target: 'A' | 'B') => {
      e.preventDefault();
      e.stopPropagation();
      
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;
      
      if (target === 'A') {
        // Procesar archivo A
        const resultA = await processFile(droppedFile);
        
        // Si hay error, no guardar y resetear
        if (!resultA.isValid) {
          setFileA({ file: null, parsedData: null, error: null, isValid: false });
          return;
        }
        
        setFileA(resultA);
        
        // Si ya existe archivo B válido, validar que coincidan
        if (fileB.file && fileB.isValid) {
          const pairResult = await processFilePair(droppedFile, fileB.file);
          if (!pairResult.hasError) {
            setFileA(pairResult.fileGroupA);
            setFileB(pairResult.fileGroupB);
          } else {
            // Error de coincidencia, resetear archivo A
            setFileA({ file: null, parsedData: null, error: null, isValid: false });
          }
        }
      } else {
        // Procesar archivo B
        const resultB = await processFile(droppedFile);
        
        // Si hay error, no guardar y resetear
        if (!resultB.isValid) {
          setFileB({ file: null, parsedData: null, error: null, isValid: false });
          return;
        }
        
        setFileB(resultB);
        
        // Si ya existe archivo A válido, validar que coincidan
        if (fileA.file && fileA.isValid) {
          const pairResult = await processFilePair(fileA.file, droppedFile);
          if (!pairResult.hasError) {
            setFileA(pairResult.fileGroupA);
            setFileB(pairResult.fileGroupB);
          } else {
            // Error de coincidencia, resetear archivo B
            setFileB({ file: null, parsedData: null, error: null, isValid: false });
          }
        }
      }
    },
    [fileA.file, fileA.isValid, fileB.file, fileB.isValid, processFile, processFilePair, setFileA, setFileB]
  );
  
  /**
   * Handler para input de archivo
   */
  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      
      if (target === 'A') {
        // Procesar archivo A
        const resultA = await processFile(selectedFile);
        
        // Si hay error, no guardar y resetear
        if (!resultA.isValid) {
          setFileA({ file: null, parsedData: null, error: null, isValid: false });
          return;
        }
        
        setFileA(resultA);
        
        // Si ya existe archivo B válido, validar que coincidan
        if (fileB.file && fileB.isValid) {
          const pairResult = await processFilePair(selectedFile, fileB.file);
          if (!pairResult.hasError) {
            setFileA(pairResult.fileGroupA);
            setFileB(pairResult.fileGroupB);
          } else {
            // Error de coincidencia, resetear archivo A
            setFileA({ file: null, parsedData: null, error: null, isValid: false });
          }
        }
      } else {
        // Procesar archivo B
        const resultB = await processFile(selectedFile);
        
        // Si hay error, no guardar y resetear
        if (!resultB.isValid) {
          setFileB({ file: null, parsedData: null, error: null, isValid: false });
          return;
        }
        
        setFileB(resultB);
        
        // Si ya existe archivo A válido, validar que coincidan
        if (fileA.file && fileA.isValid) {
          const pairResult = await processFilePair(fileA.file, selectedFile);
          if (!pairResult.hasError) {
            setFileA(pairResult.fileGroupA);
            setFileB(pairResult.fileGroupB);
          } else {
            // Error de coincidencia, resetear archivo B
            setFileB({ file: null, parsedData: null, error: null, isValid: false });
          }
        }
      }
      
      // Reset input para permitir re-selección del mismo archivo
      e.target.value = '';
    },
    [fileA.file, fileA.isValid, fileB.file, fileB.isValid, processFile, processFilePair, setFileA, setFileB]
  );
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Carga de archivos</h2>
        <p className="text-muted-foreground">
          Sube dos archivos CSV o Excel con la misma estructura para compararlos.
          Ambos archivos deben tener las mismas columnas en el mismo orden.
        </p>
      </div>
      
      {/* Alert de requisitos */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Requisitos:</strong> Archivos CSV o Excel (.xlsx, .xls) • Máximo 2MB •
          Mismas columnas y orden • Al menos 2 columnas y 1 fila de datos
        </AlertDescription>
      </Alert>
      
      {/* Zonas de drop */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Archivo A */}
        <FileDropZone
          label="Archivo A (Datos Actuales)"
          fileGroup={fileA}
          onDrop={(e) => handleDrop(e, 'A')}
          onFileSelect={(e) => handleFileInput(e, 'A')}
          onDragOver={handleDragOver}
          isProcessing={isProcessing}
        />
        
        {/* Archivo B */}
        <FileDropZone
          label="Archivo B (Datos Comparativos)"
          fileGroup={fileB}
          onDrop={(e) => handleDrop(e, 'B')}
          onFileSelect={(e) => handleFileInput(e, 'B')}
          onDragOver={handleDragOver}
          isProcessing={isProcessing}
        />
      </div>
      
      {/* Acción de limpieza */}
      {(fileA.file || fileB.file) && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={clearFiles}
            disabled={isProcessing}
          >
            Limpiar archivos
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: File Drop Zone
// ============================================================================

interface FileDropZoneProps {
  readonly label: string;
  readonly fileGroup: FileGroup;
  readonly onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  readonly onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  readonly isProcessing: boolean;
}

function FileDropZone({
  label,
  fileGroup,
  onDrop,
  onFileSelect,
  onDragOver,
  isProcessing,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFile = fileGroup.file !== null;
  const hasError = fileGroup.error !== null;
  const isValid = fileGroup.isValid;
  
  // Calcula el estilo del borde
  const getBorderStyle = () => {
    if (hasError) return 'border-destructive bg-destructive/5';
    if (isValid) return 'border-data-success bg-data-success/5';
    return 'border-border hover:border-primary/50 hover:bg-accent/5';
  };
  
  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="text-sm font-medium">{label}</label>
      
      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors duration-200
          ${getBorderStyle()}
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileSelect}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`Seleccionar ${label}`}
        />
        
        <div className="flex flex-col items-center text-center space-y-3">
          {hasFile ? (
            <>
              <div className="relative">
                <FileText
                  className={`w-12 h-12 ${
                    isValid ? 'text-data-success' : 'text-destructive'
                  }`}
                />
                {isValid && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-5 h-5 text-data-success bg-background rounded-full" />
                )}
              </div>
              <div className="w-full">
                <p className="font-medium truncate">{fileGroup.file!.name}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileGroup.file!.size)}
                  </p>
                  {fileGroup.parsedData && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="bg-data-success/10 text-data-success border-data-success/30">
                        {fileGroup.parsedData.rowCount} filas
                      </Badge>
                    </>
                  )}
                </div>
                {isValid && (
                  <p className="text-xs text-data-success mt-2 font-medium">
                    ✓ Archivo procesado correctamente
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Arrastra un archivo aquí</p>
                <p className="text-sm text-muted-foreground">
                  o haz clic para seleccionar
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
