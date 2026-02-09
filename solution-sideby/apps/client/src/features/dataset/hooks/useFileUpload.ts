/**
 * File Upload Hook
 *
 * Hook que gestiona la lógica de upload, validación y parsing de archivos.
 * Integra la validación del lado del cliente y el parsing con Papa Parse.
 */

import { useState } from "react";
import { parseFile } from "../utils/csvParser.js";
import { validateFile, validateHeadersMatch } from "../utils/fileValidation.js";
import { toast } from "@/shared/services/toast.js";
import type { FileGroup, FileValidationError } from "../types/wizard.types.js";

// ============================================================================
// HOOK DEFINITION
// ============================================================================

export function useFileUpload() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Procesa un archivo: valida + parsea
   */
  const processFile = async (file: File): Promise<FileGroup> => {
    setIsProcessing(true);
    let toastId: string | number | undefined;

    try {
      // Paso 1: Validación básica (tamaño y formato)
      const validationError = validateFile(file);
      if (validationError) {
        toast.error("Error de validación", validationError.message);
        return {
          file,
          parsedData: null,
          error: validationError,
          isValid: false,
        };
      }

      // Paso 2: Parsear archivo
      toastId = toast.loading(`Procesando ${file.name}...`);
      const parsedData = await parseFile(file);
      toast.dismiss(toastId); // Cerrar loading toast

      // Paso 3: Validación de estructura
      const structureError = validateFile(file, parsedData);
      if (structureError) {
        toast.error("Error de estructura", structureError.message);
        return {
          file,
          parsedData: null,
          error: structureError,
          isValid: false,
        };
      }

      // Éxito
      toast.success(
        "Archivo procesado",
        `${file.name} cargado correctamente (${parsedData.rowCount} filas)`,
      );

      return {
        file,
        parsedData,
        error: null,
        isValid: true,
      };
    } catch (error: unknown) {
      if (toastId) {
        toast.dismiss(toastId);
      }
      const fileError: FileValidationError = {
        code: "PARSE_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Error desconocido al procesar el archivo",
        file: file.name,
      };

      toast.error("Error al procesar archivo", fileError.message);

      return {
        file,
        parsedData: null,
        error: fileError,
        isValid: false,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Procesa ambos archivos y valida que coincidan
   */
  const processFilePair = async (
    fileA: File,
    fileB: File,
  ): Promise<{
    fileGroupA: FileGroup;
    fileGroupB: FileGroup;
    hasError: boolean;
  }> => {
    setIsProcessing(true);

    try {
      // Procesar ambos archivos en paralelo
      const [fileGroupA, fileGroupB] = await Promise.all([
        processFile(fileA),
        processFile(fileB),
      ]);

      // Si alguno falló, retornar
      if (!fileGroupA.isValid || !fileGroupB.isValid) {
        return {
          fileGroupA,
          fileGroupB,
          hasError: true,
        };
      }

      // Validar que los headers coincidan
      const headersError = validateHeadersMatch(
        fileGroupA.parsedData!.headers,
        fileGroupB.parsedData!.headers,
        fileA.name,
        fileB.name,
      );

      if (headersError) {
        toast.error("Los archivos no coinciden", headersError.message);

        return {
          fileGroupA: { ...fileGroupA, error: headersError, isValid: false },
          fileGroupB: { ...fileGroupB, error: headersError, isValid: false },
          hasError: true,
        };
      }

      // Éxito
      toast.success(
        "Archivos validados",
        "Ambos archivos son compatibles y están listos",
      );

      return {
        fileGroupA,
        fileGroupB,
        hasError: false,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Valida un archivo sin procesarlo (solo validaciones rápidas)
   */
  const quickValidate = (file: File): FileValidationError | null => {
    return validateFile(file);
  };

  return {
    processFile,
    processFilePair,
    quickValidate,
    isProcessing,
  };
}
