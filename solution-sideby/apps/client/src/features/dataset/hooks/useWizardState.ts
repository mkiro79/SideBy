/**
 * Wizard State Management Hook
 *
 * Hook de Zustand que gestiona el estado completo del wizard de carga de datos.
 * Implementa navegación entre pasos, validación y reset.
 * Incluye persistencia en localStorage para mantener el estado entre sesiones.
 *
 * UPDATED: Fixed kpiFields optional chaining (2026-02-08)
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  WizardState,
  WizardStep,
  FileGroup,
  ColumnMapping,
  KPIMappingField,
  SourceConfigUpdate,
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

const getCssTokenColor = (tokenName: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim();
  return value || fallback;
};

const initialState: WizardState = {
  currentStep: 1,
  datasetId: null, // NEW: Store datasetId from Phase 1
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
  sourceConfig: {
    groupA: {
      label: "Grupo A",
      color: getCssTokenColor("--color-data-primary", "#3b82f6"),
    },
    groupB: {
      label: "Grupo B",
      color: getCssTokenColor("--color-data-comparative", "#6366f1"),
    },
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

  // Dataset ID (NEW for 2-phase flow)
  setDatasetId: (id: string) => void;

  // File Management
  setFileA: (fileGroup: Partial<FileGroup>) => void;
  setFileB: (fileGroup: Partial<FileGroup>) => void;
  clearFiles: () => void;

  // Mapping
  setMapping: (mapping: Partial<ColumnMapping>) => void;
  addKPIField: (field: KPIMappingField) => void;
  removeKPIField: (fieldId: string) => void;

  // Configuration
  setMetadata: (metadata: Partial<WizardState["metadata"]>) => void;
  setAIConfig: (config: Partial<WizardState["aiConfig"]>) => void;
  setSourceConfig: (config: SourceConfigUpdate) => void;

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
      // DATASET ID ACTIONS (NEW)
      // ============================================================================

      setDatasetId: (id) => {
        set({ datasetId: id });
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
            kpiFields: [...(state.mapping.kpiFields || []), field],
          },
        }));
      },

      removeKPIField: (fieldId) => {
        set((state) => ({
          mapping: {
            ...state.mapping,
            kpiFields: (state.mapping.kpiFields || []).filter(
              (f) => f.id !== fieldId,
            ),
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

      setSourceConfig: (config) => {
        set((state) => ({
          sourceConfig: {
            groupA: { ...state.sourceConfig.groupA, ...config.groupA },
            groupB: { ...state.sourceConfig.groupB, ...config.groupB },
          },
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
        // dimensionField es opcional, solo requerimos al menos un KPI
        return (mapping.kpiFields || []).length > 0;
      },

      canSubmit: () => {
        const { metadata, sourceConfig, canProceedToStep2, canProceedToStep3 } = get();
        return (
          canProceedToStep2() &&
          canProceedToStep3() &&
          metadata.name.trim() !== "" &&
          sourceConfig.groupA.label.trim() !== "" &&
          sourceConfig.groupB.label.trim() !== ""
        );
      },
    }),
    {
      name: "sideby-wizard-storage", // Nombre de la clave en localStorage
      storage: createJSONStorage(() => localStorage),
      // No persistir archivos File (binarios), solo metadatos
      partialize: (state) => ({
        currentStep: state.currentStep,
        datasetId: state.datasetId, // NEW: Persist datasetId
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
        sourceConfig: state.sourceConfig,
      }),
    },
  ),
);
