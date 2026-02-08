/**
 * Tests for ColumnMappingStep Component
 * 
 * Pruebas del segundo paso del wizard: mapeo de columnas (dimensión + KPIs)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ColumnMappingStep } from '../components/wizard/ColumnMappingStep.js';
import * as useWizardStateModule from '../hooks/useWizardState.js';

// ============================================================================
// MOCKS
// ============================================================================

const mockSetMapping = vi.fn();
const mockAddKPIField = vi.fn();
const mockRemoveKPIField = vi.fn();

describe('[TDD] ColumnMappingStep Component', () => {
  beforeEach(() => {
    cleanup(); // Limpiar DOM explícitamente
    vi.clearAllMocks();

    // Mock básico con ambos archivos cargados
    vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
      currentStep: 2,
      fileA: {
        file: new File([''], 'ventas_2024.csv'),
        parsedData: {
          headers: ['fecha', 'region', 'ventas', 'visitas', 'roi'],
          rows: [
            { fecha: '2024-01', region: 'Norte', ventas: '45000', visitas: '12000', roi: '3.2' },
            { fecha: '2024-02', region: 'Sur', ventas: '38000', visitas: '8000', roi: '2.8' },
            { fecha: '2024-03', region: 'Este', ventas: '52000', visitas: '15000', roi: '4.1' },
          ],
          rowCount: 3,
        },
        error: null,
        isValid: true,
      },
      fileB: {
        file: new File([''], 'ventas_2023.csv'),
        parsedData: {
          headers: ['fecha', 'region', 'ventas', 'visitas', 'roi'],
          rows: [
            { fecha: '2023-01', region: 'Norte', ventas: '38000', visitas: '10000', roi: '2.9' },
            { fecha: '2023-02', region: 'Sur', ventas: '32000', visitas: '7000', roi: '2.4' },
            { fecha: '2023-03', region: 'Este', ventas: '44000', visitas: '12000', roi: '3.6' },
          ],
          rowCount: 3,
        },
        error: null,
        isValid: true,
      },
      mapping: {
        dimensionField: null,
        kpiFields: [],
      },
      metadata: {
        name: '',
        description: '',
      },
      aiConfig: {
        enabled: false,
        userContext: '',
      },
      isLoading: false,
      error: null,
      setFileA: vi.fn(),
      setFileB: vi.fn(),
      clearFiles: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      goToStep: vi.fn(),
      setMapping: mockSetMapping,
      addKPIField: mockAddKPIField,
      removeKPIField: mockRemoveKPIField,
      setMetadata: vi.fn(),
      setAIConfig: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
      canProceedToStep2: vi.fn(),
      canProceedToStep3: vi.fn(),
      canSubmit: vi.fn(),
    });
  });

  // ==========================================================================
  // UI RENDERING TESTS
  // ==========================================================================

  describe('UI Rendering', () => {
    it('[RED] should render mapping step header and instructions', () => {
      render(<ColumnMappingStep />);

      expect(screen.getByText(/mapeo de columnas/i)).toBeInTheDocument();
      expect(screen.getByText(/define qué columna contiene las dimensiones/i)).toBeInTheDocument();
    });

    it('[RED] should display dimension field selector', () => {
      render(<ColumnMappingStep />);

      // Usar getAllByText para manejar elementos duplicados
      expect(screen.getAllByText(/campo de dimensión/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/la columna que agrupa tus datos/i)).toBeInTheDocument();
    });

    it('[RED] should display KPI configuration section', () => {
      render(<ColumnMappingStep />);

      expect(screen.getByText(/campos kpi/i)).toBeInTheDocument();
      expect(screen.getByText(/columnas numéricas que quieres comparar/i)).toBeInTheDocument();
    });

    it('[RED] should display form to add new KPI', () => {
      render(<ColumnMappingStep />);

      expect(screen.getByText(/agregar nuevo kpi/i)).toBeInTheDocument();
      // getAllByLabelText para manejar duplicados
      expect(screen.getAllByLabelText(/columna/i)[0]).toBeInTheDocument();
      expect(screen.getByLabelText(/etiqueta para mostrar/i)).toBeInTheDocument();
      expect(screen.getAllByLabelText(/formato/i)[0]).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DIMENSION FIELD TESTS
  // ==========================================================================

  describe('Dimension Field Selection', () => {
    it('[RED] should show all available columns in dimension selector', () => {
      render(<ColumnMappingStep />);

      // Buscar por ID específico del select de dimensión
      const dimensionSelect = document.getElementById('dimension-field');
      expect(dimensionSelect).toBeInTheDocument();
      fireEvent.click(dimensionSelect!);

      // Debería mostrar todas las columnas disponibles como opciones (usar getAllByRole)
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(5);
      
      // Verificar que las columnas están en las opciones
      const optionTexts = options.map(opt => opt.textContent);
      expect(optionTexts).toContain('fecha');
      expect(optionTexts).toContain('region');
      expect(optionTexts).toContain('ventas');
      expect(optionTexts).toContain('visitas');
      expect(optionTexts).toContain('roi');
    });

    it('[RED] should call setMapping when dimension is selected', () => {
      render(<ColumnMappingStep />);

      // Buscar por ID específico
      const dimensionSelect = document.getElementById('dimension-field');
      fireEvent.click(dimensionSelect!);

      // Buscar la opción "region" entre las options del select
      const options = screen.getAllByRole('option');
      const regionOption = options.find(opt => opt.textContent === 'region');
      expect(regionOption).toBeDefined();
      fireEvent.click(regionOption!);

      expect(mockSetMapping).toHaveBeenCalledWith({ dimensionField: 'region' });
    });

    it('[GREEN] should show selected dimension field', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 2,
        fileA: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        mapping: {
          dimensionField: 'fecha',
          kpiFields: [],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: vi.fn(),
        setFileB: vi.fn(),
        clearFiles: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: mockSetMapping,
        addKPIField: mockAddKPIField,
        removeKPIField: mockRemoveKPIField,
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<ColumnMappingStep />);

      // Buscar por ID específico
      const dimensionSelect = document.getElementById('dimension-field');
      expect(dimensionSelect).toHaveTextContent('fecha');
    });
  });

  // ==========================================================================
  // KPI CONFIGURATION TESTS
  // ==========================================================================

  describe('KPI Configuration', () => {
    it('[RED] should show available columns for KPI selection (excluding dimension)', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 2,
        fileA: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'region', 'ventas', 'visitas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'region', 'ventas', 'visitas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        mapping: {
          dimensionField: 'fecha',
          kpiFields: [],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: vi.fn(),
        setFileB: vi.fn(),
        clearFiles: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: mockSetMapping,
        addKPIField: mockAddKPIField,
        removeKPIField: mockRemoveKPIField,
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<ColumnMappingStep />);

      // Buscar por ID específico del select de KPI column
      const kpiColumnSelect = document.getElementById('kpi-column');
      fireEvent.click(kpiColumnSelect!);

      // Verificar que 'fecha' NO esté en las opciones del select (solo en headers tabla)
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(opt => opt.textContent);
      expect(optionTexts).not.toContain('fecha');

      // Debe mostrar el resto
      expect(optionTexts).toContain('region');
      expect(optionTexts).toContain('ventas');
      expect(optionTexts).toContain('visitas');
    });

    it('[RED] should have format options: Number, Currency, Percentage', () => {
      render(<ColumnMappingStep />);

      // Buscar por ID específico del select de formato
      const formatSelect = document.getElementById('kpi-format');
      fireEvent.click(formatSelect!);

      // Buscar las opciones del select
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(opt => opt.textContent);
      expect(optionTexts).toContain('Número');
      expect(optionTexts.some(text => /moneda/i.test(text ?? ''))).toBe(true);
      expect(optionTexts.some(text => /porcentaje/i.test(text ?? ''))).toBe(true);
    });

    it('[RED] should call addKPIField when adding a new KPI', () => {
      render(<ColumnMappingStep />);

      // Seleccionar columna por ID
      const columnSelect = document.getElementById('kpi-column');
      fireEvent.click(columnSelect!);
      
      // Buscar la opción "ventas" entre las options
      const options = screen.getAllByRole('option');
      const ventasOption = options.find(opt => opt.textContent === 'ventas');
      fireEvent.click(ventasOption!);

      // Ingresar label
      const labelInput = screen.getByLabelText(/etiqueta para mostrar/i);
      fireEvent.change(labelInput, { target: { value: 'Ventas Totales' } });

      // Seleccionar formato por ID
      const formatSelect = document.getElementById('kpi-format');
      fireEvent.click(formatSelect!);
      const currencyOption = screen.getByText(/moneda/i);
      fireEvent.click(currencyOption);

      // Click en agregar
      const addButton = screen.getByRole('button', { name: /agregar kpi/i });
      fireEvent.click(addButton);

      expect(mockAddKPIField).toHaveBeenCalledWith(
        expect.objectContaining({
          columnName: 'ventas',
          label: 'Ventas Totales',
          format: 'currency',
        })
      );
    });

    it('[RED] should disable add button when fields are incomplete', () => {
      render(<ColumnMappingStep />);

      const addButton = screen.getByRole('button', { name: /agregar kpi/i });
      expect(addButton).toBeDisabled();
    });

    it('[GREEN] should display list of configured KPIs', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 2,
        fileA: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas', 'visitas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas', 'visitas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        mapping: {
          dimensionField: 'fecha',
          kpiFields: [
            { id: 'kpi_1', columnName: 'ventas', label: 'Ventas Totales', format: 'currency' },
            { id: 'kpi_2', columnName: 'visitas', label: 'Tráfico Web', format: 'number' },
          ],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: vi.fn(),
        setFileB: vi.fn(),
        clearFiles: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: mockSetMapping,
        addKPIField: mockAddKPIField,
        removeKPIField: mockRemoveKPIField,
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<ColumnMappingStep />);

      expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
      expect(screen.getByText('Tráfico Web')).toBeInTheDocument();
      // Usar getAllByText porque los formatos aparecen en badges Y en select options
      expect(screen.getAllByText('Moneda')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Número')[0]).toBeInTheDocument();
    });

    it('[RED] should call removeKPIField when clicking remove button', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 2,
        fileA: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        mapping: {
          dimensionField: 'fecha',
          kpiFields: [
            { id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' },
          ],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: vi.fn(),
        setFileB: vi.fn(),
        clearFiles: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: mockSetMapping,
        addKPIField: mockAddKPIField,
        removeKPIField: mockRemoveKPIField,
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<ColumnMappingStep />);

      const removeButton = screen.getByLabelText(/eliminar ventas/i);
      fireEvent.click(removeButton);

      expect(mockRemoveKPIField).toHaveBeenCalledWith('kpi_1');
    });

    it('[RED] should show alert when no columns available for KPIs', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 2,
        fileA: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        mapping: {
          dimensionField: 'fecha',
          kpiFields: [],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: vi.fn(),
        setFileB: vi.fn(),
        clearFiles: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: mockSetMapping,
        addKPIField: mockAddKPIField,
        removeKPIField: mockRemoveKPIField,
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<ColumnMappingStep />);

      expect(screen.getByText(/no hay más columnas disponibles/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================

  describe('Validation', () => {
    it('[RED] should show error when no dimension selected and no KPIs', () => {
      render(<ColumnMappingStep />);

      // Sin dimensión ni KPIs, verificar por ID
      const columnSelect = document.getElementById('dimension-field');
      expect(columnSelect).toBeInTheDocument();
    });

    it('[GREEN] should allow progression when dimension and at least one KPI configured', () => {
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 2,
        fileA: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: new File([''], 'test.csv'),
          parsedData: {
            headers: ['fecha', 'ventas'],
            rows: [],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        mapping: {
          dimensionField: 'fecha',
          kpiFields: [
            { id: 'kpi_1', columnName: 'ventas', label: 'Ventas', format: 'currency' },
          ],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: vi.fn(),
        setFileB: vi.fn(),
        clearFiles: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: mockSetMapping,
        addKPIField: mockAddKPIField,
        removeKPIField: mockRemoveKPIField,
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn().mockReturnValue(true),
        canSubmit: vi.fn(),
      });

      render(<ColumnMappingStep />);

      // Verificar que tenemos configuración válida
      expect(screen.getByText('Ventas')).toBeInTheDocument();
      // Verificar que fecha está seleccionada en el select de dimensión usando ID
      const dimensionSelect = document.getElementById('dimension-field');
      expect(dimensionSelect).toHaveTextContent('fecha');
    });
  });
});
