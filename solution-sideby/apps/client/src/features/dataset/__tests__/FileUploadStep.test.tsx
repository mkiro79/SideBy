/**
 * Tests for FileUploadStep Component
 * 
 * Pruebas del primer paso del wizard: carga y validación de archivos CSV
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploadStep } from '../components/wizard/FileUploadStep.js';
import * as useFileUploadModule from '../hooks/useFileUpload.js';
import * as useWizardStateModule from '../hooks/useWizardState.js';

// ============================================================================
// MOCKS
// ============================================================================

const mockSetFileA = vi.fn();
const mockSetFileB = vi.fn();
const mockClearFiles = vi.fn();
const mockProcessFile = vi.fn();
const mockProcessFilePair = vi.fn();

const createMockFile = (
  name: string,
  content: string = 'id,name,value\n1,Test,100'
): File => {
  const blob = new Blob([content], { type: 'text/csv' });
  return new File([blob], name, { type: 'text/csv', lastModified: Date.now() });
};

describe('[TDD] FileUploadStep Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useWizardState hook
    vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
      currentStep: 1,
      fileA: {
        file: null,
        parsedData: null,
        error: null,
        isValid: false,
      },
      fileB: {
        file: null,
        parsedData: null,
        error: null,
        isValid: false,
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
      setFileA: mockSetFileA,
      setFileB: mockSetFileB,
      clearFiles: mockClearFiles,
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      goToStep: vi.fn(),
      setMapping: vi.fn(),
      addKPIField: vi.fn(),
      removeKPIField: vi.fn(),
      setMetadata: vi.fn(),
      setAIConfig: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      reset: vi.fn(),
      canProceedToStep2: vi.fn(),
      canProceedToStep3: vi.fn(),
      canSubmit: vi.fn(),
    });

    // Mock useFileUpload hook
    vi.spyOn(useFileUploadModule, 'useFileUpload').mockReturnValue({
      processFile: mockProcessFile,
      processFilePair: mockProcessFilePair,
      quickValidate: vi.fn().mockReturnValue(null),
      isProcessing: false,
    });
  });

  // ==========================================================================
  // UI RENDERING TESTS
  // ==========================================================================

  describe('UI Rendering', () => {
    it('[RED] should render upload zones for File A and File B', () => {
      render(<FileUploadStep />);

      expect(screen.getByText(/archivo a \(datos actuales\)/i)).toBeInTheDocument();
      expect(screen.getByText(/archivo b \(datos comparativos\)/i)).toBeInTheDocument();
    });

    it('[RED] should display requirements alert', () => {
      render(<FileUploadStep />);

      expect(screen.getByText(/requisitos:/i)).toBeInTheDocument();
      expect(screen.getByText(/máximo 2mb/i)).toBeInTheDocument();
      expect(screen.getByText(/csv o excel/i)).toBeInTheDocument();
    });

    it('[RED] should show drag and drop instructions when no files uploaded', () => {
      render(<FileUploadStep />);

      const dropZones = screen.getAllByText(/arrastra un archivo aquí/i);
      expect(dropZones).toHaveLength(2); // One for A, one for B
    });

    it('[RED] should not show clear button when no files uploaded', () => {
      render(<FileUploadStep />);

      const clearButton = screen.queryByRole('button', { name: /limpiar archivos/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FILE UPLOAD SUCCESS TESTS
  // ==========================================================================

  describe('File Upload - Success Cases', () => {
    it('[RED] should process and display File A when uploaded successfully', async () => {
      const validFile = createMockFile('test_data_2024.csv');
      const mockParsedData = {
        headers: ['id', 'name', 'value'],
        rows: [
          ['1', 'Test', '100'],
          ['2', 'Demo', '200'],
        ],
        rowCount: 2,
      };

      mockProcessFile.mockResolvedValue({
        file: validFile,
        parsedData: mockParsedData,
        error: null,
        isValid: true,
      });

      render(<FileUploadStep />);

      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0];
      fireEvent.change(fileInputA, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(mockProcessFile).toHaveBeenCalledWith(validFile);
        expect(mockSetFileA).toHaveBeenCalledWith(
          expect.objectContaining({
            file: validFile,
            isValid: true,
          })
        );
      });
    });

    it('[RED] should process and display File B when uploaded successfully', async () => {
      const validFile = createMockFile('test_data_2023.csv');
      const mockParsedData = {
        headers: ['id', 'name', 'value'],
        rows: [
          ['1', 'Test', '90'],
          ['2', 'Demo', '180'],
        ],
        rowCount: 2,
      };

      mockProcessFile.mockResolvedValue({
        file: validFile,
        parsedData: mockParsedData,
        error: null,
        isValid: true,
      });

      render(<FileUploadStep />);

      const fileInputB = screen.getAllByLabelText(/seleccionar archivo b/i)[0];
      fireEvent.change(fileInputB, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(mockProcessFile).toHaveBeenCalledWith(validFile);
        expect(mockSetFileB).toHaveBeenCalledWith(
          expect.objectContaining({
            file: validFile,
            isValid: true,
          })
        );
      });
    });

    it('[GREEN] should display file info when file is loaded', () => {
      const mockFile = createMockFile('sales_2024.csv');

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 1,
        fileA: {
          file: mockFile,
          parsedData: {
            headers: ['date', 'sales'],
            rows: [['2024-01', '1000']],
            rowCount: 150,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: null,
          parsedData: null,
          error: null,
          isValid: false,
        },
        mapping: {
          dimensionField: null,
          kpiFields: [],
        },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: mockSetFileA,
        setFileB: mockSetFileB,
        clearFiles: mockClearFiles,
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: vi.fn(),
        addKPIField: vi.fn(),
        removeKPIField: vi.fn(),
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<FileUploadStep />);

      expect(screen.getByText('sales_2024.csv')).toBeInTheDocument();
      expect(screen.getByText('150 filas')).toBeInTheDocument();
      expect(screen.getByText(/archivo procesado correctamente/i)).toBeInTheDocument();
    });

    it('[RED] should show clear button when at least one file is uploaded', () => {
      const mockFile = createMockFile('test.csv');

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 1,
        fileA: {
          file: mockFile,
          parsedData: {
            headers: ['col1'],
            rows: [['val1']],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: null,
          parsedData: null,
          error: null,
          isValid: false,
        },
        mapping: { dimensionField: null, kpiFields: [] },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: mockSetFileA,
        setFileB: mockSetFileB,
        clearFiles: mockClearFiles,
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: vi.fn(),
        addKPIField: vi.fn(),
        removeKPIField: vi.fn(),
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<FileUploadStep />);

      const clearButton = screen.getByRole('button', { name: /limpiar archivos/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('[RED] should call clearFiles when clear button is clicked', () => {
      const mockFile = createMockFile('test.csv');

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 1,
        fileA: {
          file: mockFile,
          parsedData: null,
          error: null,
          isValid: true,
        },
        fileB: {
          file: null,
          parsedData: null,
          error: null,
          isValid: false,
        },
        mapping: { dimensionField: null, kpiFields: [] },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: mockSetFileA,
        setFileB: mockSetFileB,
        clearFiles: mockClearFiles,
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: vi.fn(),
        addKPIField: vi.fn(),
        removeKPIField: vi.fn(),
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      render(<FileUploadStep />);

      const clearButton = screen.getByRole('button', { name: /limpiar archivos/i });
      fireEvent.click(clearButton);

      expect(mockClearFiles).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // FILE VALIDATION TESTS
  // ==========================================================================

  describe('File Validation - Error Cases', () => {
    it('[RED] should reject empty files', async () => {
      const emptyFile = createMockFile('empty.csv', '');

      mockProcessFile.mockResolvedValue({
        file: null,
        parsedData: null,
        error: 'El archivo está vacío',
        isValid: false,
      });

      render(<FileUploadStep />);

      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0];
      fireEvent.change(fileInputA, { target: { files: [emptyFile] } });

      await waitFor(() => {
        expect(mockProcessFile).toHaveBeenCalledWith(emptyFile);
        expect(mockSetFileA).toHaveBeenCalledWith(
          expect.objectContaining({
            file: null,
            isValid: false,
          })
        );
      });
    });

    it('[RED] should reject files larger than 2MB', async () => {
      const largeFile = createMockFile('large.csv');

      mockProcessFile.mockResolvedValue({
        file: null,
        parsedData: null,
        error: 'El archivo excede el tamaño máximo de 2MB',
        isValid: false,
      });

      render(<FileUploadStep />);

      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0];
      fireEvent.change(fileInputA, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(mockProcessFile).toHaveBeenCalledWith(largeFile);
        expect(mockSetFileA).toHaveBeenCalledWith(
          expect.objectContaining({
            isValid: false,
          })
        );
      });
    });

    it('[RED] should reject files with invalid format', async () => {
      const blob = new Blob(['invalid content'], { type: 'text/plain' });
      const invalidFile = new File([blob], 'test.txt', { type: 'text/plain' });

      mockProcessFile.mockResolvedValue({
        file: null,
        parsedData: null,
        error: 'Formato de archivo no soportado. Usa CSV o Excel',
        isValid: false,
      });

      render(<FileUploadStep />);

      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0];
      fireEvent.change(fileInputA, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(mockProcessFile).toHaveBeenCalledWith(invalidFile);
        expect(mockSetFileA).toHaveBeenCalledWith(
          expect.objectContaining({
            isValid: false,
          })
        );
      });
    });

    it('[RED] should validate that both files have matching columns', async () => {
      const fileA = createMockFile('data_a.csv', 'id,name,value\n1,Test,100');
      const fileB = createMockFile('data_b.csv', 'id,different\n1,Mismatch');

      mockProcessFile.mockResolvedValueOnce({
        file: fileA,
        parsedData: {
          headers: ['id', 'name', 'value'],
          rows: [['1', 'Test', '100']],
          rowCount: 1,
        },
        error: null,
        isValid: true,
      });

      // Mock state with File A already loaded
      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 1,
        fileA: {
          file: fileA,
          parsedData: {
            headers: ['id', 'name', 'value'],
            rows: [['1', 'Test', '100']],
            rowCount: 1,
          },
          error: null,
          isValid: true,
        },
        fileB: {
          file: null,
          parsedData: null,
          error: null,
          isValid: false,
        },
        mapping: { dimensionField: null, kpiFields: [] },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: mockSetFileA,
        setFileB: mockSetFileB,
        clearFiles: mockClearFiles,
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: vi.fn(),
        addKPIField: vi.fn(),
        removeKPIField: vi.fn(),
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      mockProcessFile.mockResolvedValueOnce({
        file: fileB,
        parsedData: {
          headers: ['id', 'different'],
          rows: [['1', 'Mismatch']],
          rowCount: 1,
        },
        error: null,
        isValid: true,
      });

      mockProcessFilePair.mockResolvedValue({
        hasError: true,
        error: 'Los archivos no tienen las mismas columnas',
        fileGroupA: {
          file: fileA,
          parsedData: null,
          error: 'Los archivos no tienen las mismas columnas',
          isValid: false,
        },
        fileGroupB: {
          file: null,
          parsedData: null,
          error: null,
          isValid: false,
        },
      });

      render(<FileUploadStep />);

      const fileInputB = screen.getAllByLabelText(/seleccionar archivo b/i)[0];
      fireEvent.change(fileInputB, { target: { files: [fileB] } });

      await waitFor(() => {
        expect(mockProcessFilePair).toHaveBeenCalled();
        expect(mockSetFileB).toHaveBeenCalledWith(
          expect.objectContaining({
            isValid: false,
          })
        );
      });
    });
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading States', () => {
    it('[RED] should disable inputs while processing', () => {
      vi.spyOn(useFileUploadModule, 'useFileUpload').mockReturnValue({
        processFile: mockProcessFile,
        processFilePair: mockProcessFilePair,
        quickValidate: vi.fn().mockReturnValue(null),
        isProcessing: true,
      });

      render(<FileUploadStep />);

      const fileInputs = screen.getAllByLabelText(/seleccionar archivo/i);
      fileInputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it('[RED] should disable clear button while processing', () => {
      const mockFile = createMockFile('test.csv');

      vi.spyOn(useWizardStateModule, 'useWizardState').mockReturnValue({
        currentStep: 1,
        fileA: {
          file: mockFile,
          parsedData: null,
          error: null,
          isValid: true,
        },
        fileB: {
          file: null,
          parsedData: null,
          error: null,
          isValid: false,
        },
        mapping: { dimensionField: null, kpiFields: [] },
        metadata: { name: '', description: '' },
        aiConfig: { enabled: false, userContext: '' },
        isLoading: false,
        error: null,
        setFileA: mockSetFileA,
        setFileB: mockSetFileB,
        clearFiles: mockClearFiles,
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        goToStep: vi.fn(),
        setMapping: vi.fn(),
        addKPIField: vi.fn(),
        removeKPIField: vi.fn(),
        setMetadata: vi.fn(),
        setAIConfig: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        reset: vi.fn(),
        canProceedToStep2: vi.fn(),
        canProceedToStep3: vi.fn(),
        canSubmit: vi.fn(),
      });

      vi.spyOn(useFileUploadModule, 'useFileUpload').mockReturnValue({
        processFile: mockProcessFile,
        processFilePair: mockProcessFilePair,
        quickValidate: vi.fn().mockReturnValue(null),
        isProcessing: true,
      });

      render(<FileUploadStep />);

      const clearButton = screen.getByRole('button', { name: /limpiar archivos/i });
      expect(clearButton).toBeDisabled();
    });
  });
});
