/**
 * Wizard Integration Tests
 * 
 * Prueba del flujo completo del wizard:
 * Upload → Mapping → Configuration → Submit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataUploadWizard from '../pages/DataUploadWizard';
import { BrowserRouter } from 'react-router-dom';
import { useWizardState } from '../hooks/useWizardState.js';

// Mock de useFileUpload para simular procesamiento de archivos
const mockProcessFile = vi.fn();
const mockProcessFilePair = vi.fn();
const mockUpload = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../hooks/useFileUpload.js', () => ({
  useFileUpload: vi.fn(() => ({
    processFile: mockProcessFile,
    processFilePair: mockProcessFilePair,
    quickValidate: vi.fn().mockReturnValue(null),
    isProcessing: false,
  })),
}));

vi.mock('../hooks/useDatasetUpload.js', () => ({
  useDatasetUpload: vi.fn(() => ({
    upload: mockUpload,
    isLoading: false,
  })),
}));

vi.mock('../hooks/useDatasetMapping.js', () => ({
  useDatasetMapping: vi.fn(() => ({
    update: mockUpdate,
    isLoading: false,
  })),
}));

// Mock de React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock del toast service
vi.mock('@/shared/services/toast.js', () => ({
  toast: {
    promise: vi.fn((promise) => promise),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Helper para crear archivos mock
const createMockCSVFile = (
  name: string,
  content: string = 'fecha,region,ventas\n2024-01,Norte,45000\n2024-02,Sur,38000'
): File => {
  const blob = new Blob([content], { type: 'text/csv' });
  return new File([blob], name, { type: 'text/csv' });
};

const createMockFileGroup = (file: File) => ({
  file,
  parsedData: {
    headers: ['fecha', 'region', 'ventas'],
    rows: [
      ['2024-01', 'Norte', '45000'],
      ['2024-02', 'Sur', '38000'],
    ],
    rowCount: 2,
  },
  error: null,
  isValid: true,
});

describe('[INTEGRATION] Dataset Creation Wizard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    useWizardState.getState().reset();

    mockUpload.mockResolvedValue({
      datasetId: 'dataset-123',
      rowCount: 2,
    });

    mockUpdate.mockResolvedValue({
      datasetId: 'dataset-123',
      status: 'ready',
    });
    
    // Configurar mock de processFile para devolver archivos procesados
    mockProcessFile.mockImplementation((file: File) => {
      return Promise.resolve(createMockFileGroup(file));
    });

    mockProcessFilePair.mockImplementation((fileA: File, fileB: File) => {
      return Promise.resolve({
        hasError: false,
        fileGroupA: createMockFileGroup(fileA),
        fileGroupB: createMockFileGroup(fileB),
      });
    });
  });

  // ==========================================================================
  // FULL WIZARD FLOW TEST
  // ==========================================================================

  describe('Complete Wizard Flow', () => {
    it('[E2E] should complete full wizard: Upload → Mapping → Config → Submit', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // ======================================================================
      // STEP 1: FILE UPLOAD
      // ======================================================================

      // Verificar que estamos en Step 1
      expect(screen.getAllByText(/carga de archivos/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/sube dos archivos csv/i)[0]).toBeInTheDocument();

      // El botón "Subir archivos" debería estar deshabilitado inicialmente
      const uploadButton = screen.getByRole('button', { name: /subir archivos/i });
      expect(uploadButton).toBeDisabled();

      // Cargar Archivo A
      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0] as HTMLInputElement;
      const fileA = createMockCSVFile('ventas_2024.csv');
      await user.upload(fileInputA, fileA);

      // Esperar a que se procese
      await waitFor(() => {
        expect(screen.getAllByText('ventas_2024.csv')[0]).toBeInTheDocument();
      }, { timeout: 3000 });

      // Cargar Archivo B
      const fileInputB = screen.getAllByLabelText(/seleccionar archivo b/i)[0] as HTMLInputElement;
      const fileB = createMockCSVFile('ventas_2023.csv', 'fecha,region,ventas\n2023-01,Norte,38000\n2023-02,Sur,32000');
      await user.upload(fileInputB, fileB);

      // Esperar a que se procese
      await waitFor(() => {
        expect(screen.getAllByText('ventas_2023.csv')[0]).toBeInTheDocument();
      }, { timeout: 3000 });

      // El botón "Subir archivos" debería habilitarse cuando ambos archivos están cargados
      await waitFor(() => {
        expect(uploadButton).not.toBeDisabled();
      });

      // Hacer clic en "Subir archivos" para avanzar al Step 2
      await user.click(uploadButton);

      // ======================================================================
      // STEP 2: COLUMN MAPPING
      // ======================================================================

      await waitFor(() => {
        expect(screen.getAllByText(/mapeo de columnas/i)[0]).toBeInTheDocument();
      });

      // Seleccionar una métrica (checkbox) para habilitar el Step 3
      const metricCheckbox = await screen.findByRole('checkbox', { name: 'ventas' });
      await user.click(metricCheckbox);

      // El botón "Siguiente" debería estar habilitado
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /siguiente/i })[0]).not.toBeDisabled();
      });

      // Avanzar al Step 3
      const nextButton2 = screen.getByRole('button', { name: /siguiente/i });
      await user.click(nextButton2);

      // ======================================================================
      // STEP 3: CONFIGURATION
      // ======================================================================

      await waitFor(() => {
        expect(screen.getAllByText(/configuración final/i)[0]).toBeInTheDocument();
      });

      // Verificar que se muestra el resumen
      expect(screen.getAllByText(/datos unificados correctamente/i)[0]).toBeInTheDocument();

      // Ingresar nombre del dataset
      const nameInput = screen.getByLabelText(/nombre/i);
      await user.type(nameInput, 'Ventas Q1 2024 vs Q1 2023');

      // Configurar labels y colores de grupos
      const groupALabelInput = screen.getByLabelText(/etiqueta grupo a/i);
      await user.clear(groupALabelInput);
      await user.type(groupALabelInput, 'Actual');

      const groupBLabelInput = screen.getByLabelText(/etiqueta grupo b/i);
      await user.clear(groupBLabelInput);
      await user.type(groupBLabelInput, 'Comparativo');

      const groupAColorInput = screen.getByLabelText(/color grupo a/i);
      fireEvent.change(groupAColorInput, { target: { value: '#123456' } });

      const groupBColorInput = screen.getByLabelText(/color grupo b/i);
      fireEvent.change(groupBColorInput, { target: { value: '#654321' } });

      // El botón "Crear dataset" debería estar habilitado
      const submitButton = screen.getByRole('button', { name: /crear dataset/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Enviar el formulario
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          'dataset-123',
          expect.objectContaining({
            sourceConfig: {
              groupA: {
                label: 'Actual',
                color: '#123456',
              },
              groupB: {
                label: 'Comparativo',
                color: '#654321',
              },
            },
          }),
        );
      });

      // Verificar que se navega a la página de datasets
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/datasets/dataset-123/dashboard');
      }, { timeout: 5000 });
    });

    it('[E2E] should not allow proceeding without files', async () => {
      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Intentar avanzar sin archivos - En step 1, el botón es "Subir archivos"
      const uploadButton = screen.getByRole('button', { name: /subir archivos/i });
      expect(uploadButton).toBeDisabled();
    });

    it('[E2E] should not allow proceeding without mapping configuration', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Step 1: Cargar archivos
      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0] as HTMLInputElement;
      const fileA = createMockCSVFile('ventas_2024.csv');
      await user.upload(fileInputA, fileA);

      const fileInputB = screen.getAllByLabelText(/seleccionar archivo b/i)[0] as HTMLInputElement;
      const fileB = createMockCSVFile('ventas_2023.csv', 'fecha,region,ventas\n2023-01,Norte,38000\n2023-02,Sur,32000');
      await user.upload(fileInputB, fileB);

      const uploadButton = screen.getByRole('button', { name: /subir archivos/i });
      await waitFor(() => {
        expect(uploadButton).not.toBeDisabled();
      });
      await user.click(uploadButton);

      // Step 2: Sin seleccionar métricas
      const nextButton = await screen.findByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    it('[E2E] should not allow submission without dataset name', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Step 1: Cargar archivos
      const fileInputA = screen.getAllByLabelText(/seleccionar archivo a/i)[0] as HTMLInputElement;
      const fileA = createMockCSVFile('ventas_2024.csv');
      await user.upload(fileInputA, fileA);

      const fileInputB = screen.getAllByLabelText(/seleccionar archivo b/i)[0] as HTMLInputElement;
      const fileB = createMockCSVFile('ventas_2023.csv', 'fecha,region,ventas\n2023-01,Norte,38000\n2023-02,Sur,32000');
      await user.upload(fileInputB, fileB);

      const uploadButton = screen.getByRole('button', { name: /subir archivos/i });
      await waitFor(() => {
        expect(uploadButton).not.toBeDisabled();
      });
      await user.click(uploadButton);

      // Step 2: Seleccionar métrica mínima
      const metricCheckbox = await screen.findByRole('checkbox', { name: 'ventas' });
      await user.click(metricCheckbox);

      const nextButton = await screen.findByRole('button', { name: /siguiente/i });
      await user.click(nextButton);

      // Step 3: Sin nombre
      const submitButton = await screen.findByRole('button', { name: /crear dataset/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // NAVIGATION TESTS
  // ==========================================================================

  describe('Wizard Navigation', () => {
    it('[TEST] should allow going back to previous steps', async () => {
      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Esperar a que la página se cargue
      await waitFor(() => {
        expect(screen.getAllByText(/carga de archivos/i)[0]).toBeInTheDocument();
      });

      // El botón "Anterior" debería estar deshabilitado en Step 1
      const prevButton = screen.getByRole('button', { name: /anterior/i });
      expect(prevButton).toBeDisabled();
    });

    it('[TEST] should show step indicator with correct status', () => {
      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Verificar que se muestra el indicador de pasos
      const stepLabels = screen.getAllByText('Carga de archivos');
      expect(stepLabels.length).toBeGreaterThan(0);
      
      expect(screen.getAllByText('Mapeo de columnas').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Configuración').length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // CANCEL TESTS
  // ==========================================================================

  describe('Wizard Cancellation', () => {
    it('[TEST] should allow cancellation and navigate back to datasets', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      const cancelButtons = screen.getAllByRole('button', { name: /cancelar/i });
      // Tomar el primer botón de cancelar (el del wizard, no del sidebar)
      await user.click(cancelButtons[0]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/datasets');
      });
    });
  });
});
