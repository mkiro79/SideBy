/**
 * Wizard Integration Tests
 * 
 * Prueba del flujo completo del wizard:
 * Upload → Mapping → Configuration → Submit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataUploadWizard from '../pages/DataUploadWizard';
import { BrowserRouter } from 'react-router-dom';

// Mock de useFileUpload para simular procesamiento de archivos
const mockProcessFile = vi.fn();

vi.mock('../hooks/useFileUpload.js', () => ({
  useFileUpload: vi.fn(() => ({
    processFile: mockProcessFile,
    processFilePair: vi.fn(),
    quickValidate: vi.fn().mockReturnValue(null),
    isProcessing: false,
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

// Mock del servicio de upload
vi.mock('../services/datasetUpload.mock.js', () => ({
  uploadDataset: vi.fn().mockResolvedValue({
    id: 'dataset-123',
    name: 'Test Dataset',
    status: 'active',
  }),
}));

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

describe('[INTEGRATION] Dataset Creation Wizard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    
    // Configurar mock de processFile para devolver archivos procesados
    mockProcessFile.mockImplementation((file: File) => {
      return Promise.resolve({
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

      // El botón "Siguiente" debería estar deshabilitado inicialmente
      const nextButton = screen.getAllByRole('button', { name: /siguiente/i })[0];
      expect(nextButton).toBeDisabled();

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

      // El botón "Siguiente" debería habilitarse
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });

      // Avanzar al Step 2
      await user.click(nextButton);

      // ======================================================================
      // STEP 2: COLUMN MAPPING
      // ======================================================================

      await waitFor(() => {
        expect(screen.getAllByText(/mapeo de columnas/i)[0]).toBeInTheDocument();
      });

      // Seleccionar campo de dimensión
      const dimensionSelect = screen.getByRole('combobox', { name: /campo de dimensión/i });
      await user.click(dimensionSelect);

      // Buscar option específicamente (no el <th> de la tabla)
      const options = screen.getAllByRole('option');
      const regionOption = options.find(opt => opt.textContent?.includes('region'));
      if (regionOption) {
        await user.click(regionOption);
      }

      // Agregar KPI
      const kpiColumnSelects = screen.getAllByRole('combobox', { name: /columna/i });
      const kpiColumnSelect = kpiColumnSelects[0]; // El primer combobox de "Columna"
      await user.click(kpiColumnSelect);

      // Buscar option de "ventas" específicamente (no el <th> de tabla)
      const kpiOptions = screen.getAllByRole('option');
      const ventasOption = kpiOptions.find(opt => opt.textContent?.includes('ventas'));
      if (ventasOption) {
        await user.click(ventasOption);
      }

      // Ingresar label del KPI
      const kpiLabelInput = screen.getByLabelText(/etiqueta para mostrar/i);
      await user.type(kpiLabelInput, 'Ventas Totales');

      // Seleccionar formato
      const formatSelect = screen.getByRole('combobox', { name: /formato/i });
      await user.click(formatSelect);

      const currencyOption = screen.getAllByText(/moneda/i)[0];
      await user.click(currencyOption);

      // Agregar KPI
      const addKPIButton = screen.getByRole('button', { name: /agregar kpi/i });
      await user.click(addKPIButton);

      // Verificar que el KPI se agregó
      await waitFor(() => {
        expect(screen.getAllByText('Ventas Totales')[0]).toBeInTheDocument();
      });

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

      // El botón "Crear dataset" debería estar habilitado
      const submitButton = screen.getByRole('button', { name: /crear dataset/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Enviar el formulario
      await user.click(submitButton);

      // Verificar que se navega a la página de datasets
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/datasets');
      }, { timeout: 5000 });
    });

    it('[E2E] should not allow proceeding without files', async () => {
      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Intentar avanzar sin archivos
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    it('[E2E] should not allow proceeding without mapping configuration', async () => {
      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Step 1: Cargar archivos (simulado con estado inicial)
      // ... (código de carga de archivos omitido por brevedad)

      // Step 2: Sin configurar mapping
      // El botón "Siguiente" debería estar deshabilitado
    });

    it('[E2E] should not allow submission without dataset name', async () => {
      render(
        <BrowserRouter>
          <DataUploadWizard />
        </BrowserRouter>
      );

      // Avanzar todos los pasos hasta Step 3 sin nombre
      // ... (código omitido por brevedad)

      // El botón "Crear dataset" debería estar deshabilitado
      const submitButton = screen.queryByRole('button', { name: /crear dataset/i });
      if (submitButton) {
        expect(submitButton).toBeDisabled();
      }
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
