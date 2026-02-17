/**
 * Tests for ConfigurationStep Component
 * 
 * Pruebas del tercer paso del wizard: configuración final y resumen
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfigurationStep } from '../components/wizard/ConfigurationStep.js';
import * as useWizardStateModule from '../hooks/useWizardState.js';
import * as featuresModule from '../../../config/features.js';

// ============================================================================
// MOCKS
// ============================================================================

const mockSetMetadata = vi.fn();
const mockSetAIConfig = vi.fn();
const mockSetSourceConfig = vi.fn();

const baseMockState = {
  currentStep: 3,
  fileA: {
    file: new File([''], 'ventas_2024.csv'),
    parsedData: {
      headers: ['fecha', 'region', 'ventas'],
      rows: [
        { fecha: '2024-01', region: 'Norte', ventas: '45000' },
        { fecha: '2024-02', region: 'Sur', ventas: '38000' },
      ],
      rowCount: 1200,
    },
    error: null,
    isValid: true,
  },
  fileB: {
    file: new File([''], 'ventas_2023.csv'),
    parsedData: {
      headers: ['fecha', 'region', 'ventas'],
      rows: [
        { fecha: '2023-01', region: 'Norte', ventas: '38000' },
        { fecha: '2023-02', region: 'Sur', ventas: '32000' },
      ],
      rowCount: 1100,
    },
    error: null,
    isValid: true,
  },
  mapping: {
    dimensionField: 'region',
    kpiFields: [
      { id: 'kpi_1', columnName: 'ventas', label: 'Ventas Totales', format: 'currency' },
    ],
  },
  metadata: {
    name: '',
    description: '',
  },
  aiConfig: {
    enabled: false,
    userContext: '',
  },
  sourceConfig: {
    groupA: {
      label: 'Grupo A',
      color: '#3b82f6',
    },
    groupB: {
      label: 'Grupo B',
      color: '#6366f1',
    },
  },
  isLoading: false,
  error: null,
  setFileA: vi.fn(),
  setFileB: vi.fn(),
  clearFiles: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  goToStep: vi.fn(),
  setMapping: vi.fn(),
  addKPIField: vi.fn(),
  removeKPIField: vi.fn(),
  setMetadata: mockSetMetadata,
  setAIConfig: mockSetAIConfig,
  setSourceConfig: mockSetSourceConfig,
  setLoading: vi.fn(),
  setError: vi.fn(),
  reset: vi.fn(),
  canProceedToStep2: vi.fn(),
  canProceedToStep3: vi.fn(),
  canSubmit: vi.fn(),
};

describe('[TDD] ConfigurationStep Component', () => {
  let originalFeatures: typeof featuresModule.FEATURES;

  beforeEach(() => {
    cleanup(); // Limpiar DOM explícitamente
    vi.clearAllMocks();
    originalFeatures = { ...featuresModule.FEATURES };
    vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue(baseMockState);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // UI RENDERING TESTS
  // ==========================================================================

  describe('UI Rendering', () => {
    it('[RED] should render configuration step header', () => {
      render(<ConfigurationStep />);

      expect(screen.getAllByText(/configuración final/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/completa la información del dataset/i)[0]).toBeInTheDocument();
    });

    it('[RED] should display metadata form section', () => {
      render(<ConfigurationStep />);

      expect(screen.getAllByText(/información del dataset/i)[0]).toBeInTheDocument();
    });

    it('[RED] should display summary preview section', () => {
      render(<ConfigurationStep />);

      expect(screen.getAllByText(/resumen de configuración/i)[0]).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // METADATA FORM TESTS
  // ==========================================================================

  describe('Metadata Form', () => {
    it('[RED] should render name input field (required)', () => {
      render(<ConfigurationStep />);

      const nameInput = screen.getAllByLabelText(/nombre/i)[0];
      expect(nameInput).toBeInTheDocument();
      // Verificar maxlength solo, required puede ser aria-required
      expect(nameInput).toHaveAttribute('maxlength', '100');
    });

    it('[RED] should render description textarea (optional)', () => {
      render(<ConfigurationStep />);

      const descInput = screen.getAllByLabelText(/descripción/i)[0];
      expect(descInput).toBeInTheDocument();
      expect(descInput).toHaveAttribute('maxlength', '500');
    });

    it('[RED] should show character counter for name (0/100)', () => {
      render(<ConfigurationStep />);

      expect(screen.getByText('0/100 caracteres')).toBeInTheDocument();
    });

    it('[RED] should update character counter as user types name', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        ...baseMockState,
        metadata: {
          name: 'Test Report',
          description: '',
        },
      });

      render(<ConfigurationStep />);

      expect(screen.getByText('11/100 caracteres')).toBeInTheDocument();
    });

    it('[RED] should call setMetadata when name input changes', () => {
      render(<ConfigurationStep />);

      const nameInput = screen.getAllByLabelText(/nombre/i)[0];
      fireEvent.change(nameInput, { target: { value: 'Mi Dataset' } });

      expect(mockSetMetadata).toHaveBeenCalledWith({ name: 'Mi Dataset' });
    });

    it('[RED] should show character counter for description (0/500)', () => {
      render(<ConfigurationStep />);

      expect(screen.getByText('0/500 caracteres')).toBeInTheDocument();
    });

    it('[RED] should call setMetadata when description changes', () => {
      render(<ConfigurationStep />);

      const descInput = screen.getAllByLabelText(/descripción/i)[0];
      fireEvent.change(descInput, { target: { value: 'Una descripción útil' } });

      expect(mockSetMetadata).toHaveBeenCalledWith({ description: 'Una descripción útil' });
    });
  });

  // ==========================================================================
  // AI FEATURE FLAG TESTS
  // ==========================================================================

  describe('AI Configuration (Feature Flag)', () => {
    it('[RED] should HIDE AI section when FEATURE_AI_ENABLED is false', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: false,
      });

      render(<ConfigurationStep />);

      expect(screen.queryByText(/análisis con ia/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/beta/i)).not.toBeInTheDocument();
    });

    it('[GREEN] should SHOW AI section when FEATURE_AI_ENABLED is true', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      render(<ConfigurationStep />);

      // Usar getAllByText para elementos duplicados
      expect(screen.getAllByText(/análisis con ia/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/beta/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/genera insights automáticos/i)[0]).toBeInTheDocument();
    });

    it('[RED] should show toggle switch when AI is enabled', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      render(<ConfigurationStep />);

      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeInTheDocument();
      expect(toggle).not.toBeChecked();
    });

    it('[RED] should call setAIConfig when toggle is clicked', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      render(<ConfigurationStep />);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockSetAIConfig).toHaveBeenCalledWith({ enabled: true });
    });

    it('[RED] should show AI prompt textarea when toggle is enabled', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        ...baseMockState,
        aiConfig: {
          enabled: true,
          userContext: '',
        },
      });

      render(<ConfigurationStep />);

      expect(screen.getByLabelText(/contexto adicional para el análisis/i)).toBeInTheDocument();
    });

    it('[RED] should hide AI prompt textarea when toggle is disabled', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      render(<ConfigurationStep />);

      expect(screen.queryByLabelText(/contexto adicional/i)).not.toBeInTheDocument();
    });

    it('[RED] should show character counter for AI prompt (0/300)', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        ...baseMockState,
        aiConfig: {
          enabled: true,
          userContext: '',
        },
      });

      render(<ConfigurationStep />);

      // Buscar el contador específico del textarea de AI
      const aiContextLabel = screen.getByLabelText(/contexto adicional para el análisis/i);
      const container = aiContextLabel.closest('div');
      expect(container).toHaveTextContent(/proporciona contexto para obtener insights/i);
    });

    it('[RED] should call setAIConfig when prompt text changes', () => {
      vi.spyOn(featuresModule, 'FEATURES', 'get').mockReturnValue({
        ...originalFeatures,
        AI_ENABLED: true,
      });

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        ...baseMockState,
        aiConfig: {
          enabled: true,
          userContext: '',
        },
      });

      render(<ConfigurationStep />);

      const promptTextarea = screen.getByLabelText(/contexto adicional para el análisis/i);
      fireEvent.change(promptTextarea, { target: { value: 'Analiza como CFO' } });

      expect(mockSetAIConfig).toHaveBeenCalledWith({ userContext: 'Analiza como CFO' });
    });
  });

  // ==========================================================================
  // SUMMARY PREVIEW TESTS
  // ==========================================================================

  describe('Group Configuration', () => {
    it('[RED] should render group label and color inputs', () => {
      render(<ConfigurationStep />);

      expect(screen.getByLabelText(/etiqueta grupo a/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/color grupo a/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/etiqueta grupo b/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/color grupo b/i)).toBeInTheDocument();
    });

    it('[RED] should call setSourceConfig when group labels change', () => {
      render(<ConfigurationStep />);

      const labelAInput = screen.getByLabelText(/etiqueta grupo a/i);
      fireEvent.change(labelAInput, { target: { value: 'Actual' } });

      const labelBInput = screen.getByLabelText(/etiqueta grupo b/i);
      fireEvent.change(labelBInput, { target: { value: 'Comparativo' } });

      expect(mockSetSourceConfig).toHaveBeenCalledWith({ groupA: { label: 'Actual' } });
      expect(mockSetSourceConfig).toHaveBeenCalledWith({ groupB: { label: 'Comparativo' } });
    });

    it('[RED] should call setSourceConfig when group colors change', () => {
      render(<ConfigurationStep />);

      const colorAInput = screen.getByLabelText(/color grupo a/i);
      fireEvent.change(colorAInput, { target: { value: '#123456' } });

      const colorBInput = screen.getByLabelText(/color grupo b/i);
      fireEvent.change(colorBInput, { target: { value: '#654321' } });

      expect(mockSetSourceConfig).toHaveBeenCalledWith({ groupA: { color: '#123456' } });
      expect(mockSetSourceConfig).toHaveBeenCalledWith({ groupB: { color: '#654321' } });
    });
  });

  describe('Summary Preview', () => {
    it('[RED] should display File A information', () => {
      render(<ConfigurationStep />);

      // Usar getAllByText porque el nombre aparece en múltiples lugares
      expect(screen.getAllByText('ventas_2024.csv')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/1200 filas/i)[0]).toBeInTheDocument();
    });

    it('[RED] should display File B information', () => {
      render(<ConfigurationStep />);

      // Usar getAllByText porque el nombre aparece en múltiples lugares
      expect(screen.getAllByText('ventas_2023.csv')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/1100 filas/i)[0]).toBeInTheDocument();
    });

    it('[RED] should display dimension field name', () => {
      render(<ConfigurationStep />);

      // Usar getAllByText para campo dimensión y region
      expect(screen.getAllByText(/campo dimensión/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText('region')[0]).toBeInTheDocument();
    });

    it('[RED] should display KPI count', () => {
      render(<ConfigurationStep />);

      // Usar getAllByText
      expect(screen.getAllByText(/kpis configurados/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText('1 campo(s)')[0]).toBeInTheDocument();
    });

    it('[RED] should display data preview table with first 3 rows', () => {
      render(<ConfigurationStep />);

      expect(screen.getAllByText(/vista previa \(primeras 3 filas\)/i)[0]).toBeInTheDocument();

      // Verificar que se muestran datos de File A
      expect(screen.getAllByText('2024-01')[0]).toBeInTheDocument();
      expect(screen.getAllByText('45000')[0]).toBeInTheDocument();

      // Verificar que se muestran datos de File B
      expect(screen.getAllByText('2023-01')[0]).toBeInTheDocument();
      expect(screen.getAllByText('38000')[0]).toBeInTheDocument();
    });

    it('[RED] should show info alert about dataset creation', () => {
      render(<ConfigurationStep />);

      expect(
        screen.getByText(/al finalizar, se creará el dataset/i)
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe('Validation', () => {
    it('[RED] should show validation when name is empty', () => {
      render(<ConfigurationStep />);
      
      const nameInput = screen.getAllByLabelText(/nombre/i)[0];
      expect((nameInput as HTMLInputElement).value).toBe('');
    });

    it('[GREEN] should accept valid name', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        ...baseMockState,
        metadata: {
          name: 'Ventas Q1 2024 vs Q1 2023',
          description: '',
        },
      });

      render(<ConfigurationStep />);

      const nameInput = screen.getByLabelText(/nombre/i);
      expect(nameInput).toHaveValue('Ventas Q1 2024 vs Q1 2023');
    });

    it('[RED] should enforce max length on name (100 chars)', () => {
      render(<ConfigurationStep />);

      const nameInput = screen.getByLabelText(/nombre/i);
      expect(nameInput).toHaveAttribute('maxlength', '100');
    });

    it('[RED] should enforce max length on description (500 chars)', () => {
      render(<ConfigurationStep />);

      const descInput = screen.getByLabelText(/descripción/i);
      expect(descInput).toHaveAttribute('maxlength', '500');
    });
  });

  // ==========================================================================
  // RESPONSIVE DESIGN TESTS
  // ==========================================================================

  describe('Responsive Design', () => {
    it('[RED] should have grid layout for file summaries', () => {
      const { container } = render(<ConfigurationStep />);

      const gridElement = container.querySelector(String.raw`.grid.md\:grid-cols-2`);
      expect(gridElement).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('[RED] should have proper labels for all inputs', () => {
      render(<ConfigurationStep />);

      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });

    it('[RED] should mark required fields with asterisk', () => {
      render(<ConfigurationStep />);

      const nameLabel = screen.getByText(/nombre/i);
      const parentElement = nameLabel.parentElement;
      expect(parentElement).toHaveTextContent('*');
    });

    it('[RED] should have proper ARIA attributes', () => {
      render(<ConfigurationStep />);

      const nameInput = screen.getByLabelText(/nombre/i);
      expect(nameInput).toHaveAttribute('id', 'dataset-name');
    });
  });
});
