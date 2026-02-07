/**
 * Wizard State Management Hook
 *
 * Hook de Zustand que gestiona el estado completo del wizard de carga de datos.
 * Implementa navegación entre pasos, validación y reset.
 * Incluye persistencia en localStorage para mantener el estado entre sesiones.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  WizardState,
  WizardStep,
  FileGroup,
  ColumnMapping,
} from "../types/wizard.types.js";

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialFileGroup: FileGroup = {
  file: null,
  parsedData: null,
  error: null,
  isValid: false,
};

const initialMapping: ColumnMapping = {
  dimensionField: null,
  kpiFields: [],
};

const initialState: WizardState = {
  currentStep: 1,
  fileA: initialFileGroup,
  fileB: initialFileGroup,
  mapping: initialMapping,
  metadata: {
    name: "",
    description: "",
  },
  aiConfig: {
    enabled: false,
    userContext: "",
  },
  isLoading: false,
  error: null,
};

// ============================================================================
// STORE DEFINITION
// ============================================================================

interface WizardActions {
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: WizardStep) => void;

  // File Management
  setFileA: (fileGroup: Partial<FileGroup>) => void;
  setFileB: (fileGroup: Partial<FileGroup>) => void;
  clearFiles: () => void;

  // Mapping
  setMapping: (mapping: Partial<ColumnMapping>) => void;
  addKPIField: (field: ColumnMapping["kpiFields"][0]) => void;
  removeKPIField: (fieldId: string) => void;

  // Configuration
  setMetadata: (metadata: Partial<WizardState["metadata"]>) => void;
  setAIConfig: (config: Partial<WizardState["aiConfig"]>) => void;

  // Global
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Validations
  canProceedToStep2: () => boolean;
  canProceedToStep3: () => boolean;
  canSubmit: () => boolean;
}

export const useWizardState = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================================================
      // NAVIGATION ACTIONS
      // ============================================================================

      nextStep: () => {
        const { currentStep, canProceedToStep2, canProceedToStep3 } = get();

        if (currentStep === 1 && canProceedToStep2()) {
          set({ currentStep: 2 });
        } else if (currentStep === 2 && canProceedToStep3()) {
          set({ currentStep: 3 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as WizardStep });
        }
      },

      goToStep: (step) => {
        set({ currentStep: step });
      },

      // ============================================================================
      // FILE MANAGEMENT ACTIONS
      // ============================================================================

      setFileA: (fileGroup) => {
        set((state) => ({
          fileA: { ...state.fileA, ...fileGroup },
        }));
      },

      setFileB: (fileGroup) => {
        set((state) => ({
          fileB: { ...state.fileB, ...fileGroup },
        }));
      },

      clearFiles: () => {
        set({
          fileA: initialFileGroup,
          fileB: initialFileGroup,
        });
      },

      // ============================================================================
      // MAPPING ACTIONS
      // ============================================================================

      setMapping: (mapping) => {
        set((state) => ({
          mapping: { ...state.mapping, ...mapping },
        }));
      },

      addKPIField: (field) => {
        set((state) => ({
          mapping: {
            ...state.mapping,
            kpiFields: [...state.mapping.kpiFields, field],
          },
        }));
      },

      removeKPIField: (fieldId) => {
        set((state) => ({
          mapping: {
            ...state.mapping,
            kpiFields: state.mapping.kpiFields.filter((f) => f.id !== fieldId),
          },
        }));
      },

      // ============================================================================
      // CONFIGURATION ACTIONS
      // ============================================================================

      setMetadata: (metadata) => {
        set((state) => ({
          metadata: { ...state.metadata, ...metadata },
        }));
      },

      setAIConfig: (config) => {
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...config },
        }));
      },

      // ============================================================================
      // GLOBAL ACTIONS
      // ============================================================================

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      reset: () => {
        set(initialState);
      },

      // ============================================================================
      // VALIDATION METHODS
      // ============================================================================

      canProceedToStep2: () => {
        const { fileA, fileB } = get();
        return (
          fileA.isValid &&
          fileB.isValid &&
          fileA.parsedData !== null &&
          fileB.parsedData !== null
        );
      },

      canProceedToStep3: () => {
        const { mapping } = get();
        return mapping.dimensionField !== null && mapping.kpiFields.length > 0;
      },

      canSubmit: () => {
        const { metadata, canProceedToStep2, canProceedToStep3 } = get();
        return (
          canProceedToStep2() &&
          canProceedToStep3() &&
          metadata.name.trim() !== ""
        );
      },
    }),
    {
      name: "sideby-wizard-storage", // Nombre de la clave en localStorage
      storage: createJSONStorage(() => localStorage),
      // No persistir archivos File (binarios), solo metadatos
      partialize: (state) => ({
        currentStep: state.currentStep,
        fileA: {
          ...state.fileA,
          file: null, // No persistir el objeto File
        },
        fileB: {
          ...state.fileB,
          file: null, // No persistir el objeto File
        },
        mapping: state.mapping,
        metadata: state.metadata,
        aiConfig: state.aiConfig,
      }),
    },
  ),
);
