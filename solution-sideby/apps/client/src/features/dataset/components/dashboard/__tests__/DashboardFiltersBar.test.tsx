/**
 * Tests de integración para DashboardFiltersBar (RFC-005)
 * 
 * Verifica:
 * - Renderizado de multi-select dropdowns
 * - Selección/deselección de valores
 * - Chips de filtros activos con botón X
 * - Botón "Limpiar filtros"
 * - Contador de filtros activos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardFiltersBar } from '../DashboardFiltersBar.js';
import type { Dataset } from '../../../types/api.types.js';

const mockDataset: Dataset = {
  id: 'dataset-1',
  ownerId: 'owner-1',
  status: 'ready',
  meta: {
    name: 'Test Dataset',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  sourceConfig: {
    groupA: {
      label: 'Grupo A',
      color: '#3B82F6',
      originalFileName: 'a.csv',
      rowCount: 3,
    },
    groupB: {
      label: 'Grupo B',
      color: '#F97316',
      originalFileName: 'b.csv',
      rowCount: 3,
    },
  },
  schemaMapping: {
    dimensionField: 'region',
    kpiFields: [],
    categoricalFields: ['region', 'channel'],
  },
  dashboardLayout: {
    templateId: 'sideby_executive',
  },
  data: [
    { _source_group: 'groupA', region: 'north', channel: 'web' },
    { _source_group: 'groupA', region: 'south', channel: 'retail' },
    { _source_group: 'groupA', region: 'east', channel: 'web' },
    { _source_group: 'groupB', region: 'north', channel: 'retail' },
    { _source_group: 'groupB', region: 'south', channel: 'web' },
    { _source_group: 'groupB', region: 'west', channel: 'web' },
  ],
};

describe('[RFC-005] DashboardFiltersBar', () => {
  const onFilterChange = vi.fn();
  const onClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar dropdowns para cada campo categórico', () => {
    render(
      <DashboardFiltersBar
        categoricalFields={['region', 'channel']}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Debe mostrar botones de filtro
    expect(screen.getByRole('button', { name: /region/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /channel/i })).toBeInTheDocument();
  });

  it('debe mostrar contador de filtros activos', () => {
    render(
      <DashboardFiltersBar
        categoricalFields={['region', 'channel']}
        filters={{ region: ['north', 'south'], channel: ['web'] }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Debe mostrar "3 activos" (2 de region + 1 de channel)
    expect(screen.getByText('3 activos')).toBeInTheDocument();
  });

  it('debe renderizar chips de filtros activos con botón X', () => {
    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{ region: ['north', 'south'] }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Debe mostrar chips
    expect(screen.getByText('region: north')).toBeInTheDocument();
    expect(screen.getByText('region: south')).toBeInTheDocument();
  });

  it('debe eliminar filtro individual al hacer click en X del chip', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{ region: ['north', 'south'] }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Encontrar el chip de "north" y hacer click en su botón X
    const northChip = screen.getByText('region: north').closest('div');
    const removeButton = within(northChip!).getByRole('button', { name: /eliminar filtro.*north/i });
    
    await user.click(removeButton);

    // Debe llamar onFilterChange con array sin "north"
    expect(onFilterChange).toHaveBeenCalledWith('region', ['south']);
  });

  it('debe llamar onClearFilters al hacer click en "Limpiar filtros"', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{ region: ['north'] }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    const clearButton = screen.getByRole('button', { name: /limpiar todos los filtros/i });
    await user.click(clearButton);

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('NO debe mostrar botón "Limpiar filtros" si no hay filtros activos', () => {
    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    expect(screen.queryByRole('button', { name: /limpiar todos los filtros/i })).not.toBeInTheDocument();
  });

  it('debe abrir dropdown y mostrar opciones al hacer click', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Hacer click en el botón de region
    const regionButton = screen.getByRole('button', { name: /filtrar por region/i });
    await user.click(regionButton);

    // Debe mostrar las opciones (valores únicos = north, south, east, west)
    expect(await screen.findByText('north')).toBeInTheDocument();
    expect(await screen.findByText('south')).toBeInTheDocument();
    expect(await screen.findByText('east')).toBeInTheDocument();
    expect(await screen.findByText('west')).toBeInTheDocument();
  });

  it('debe seleccionar múltiples valores al hacer click en checkboxes', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Abrir dropdown
    const regionButton = screen.getByRole('button', { name: /filtrar por region/i });
    await user.click(regionButton);

    // Seleccionar "north"
    const northOption = await screen.findByText('north');
    await user.click(northOption);

    expect(onFilterChange).toHaveBeenCalledWith('region', ['north']);
    vi.clearAllMocks();

    // Seleccionar "south" también
    const southOption = screen.getByText('south');
    await user.click(southOption);

    expect(onFilterChange).toHaveBeenCalledWith('region', ['south']);
  });

  it('debe deseleccionar valor al hacer click en checkbox ya seleccionado', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{ region: ['north', 'south'] }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Abrir dropdown
    const regionButton = screen.getByRole('button', { name: /filtrar por region.*2 seleccionados/i });
    await user.click(regionButton);

    // Deseleccionar "north"
    const northOption = await screen.findByText('north');
    await user.click(northOption);

    expect(onFilterChange).toHaveBeenCalledWith('region', ['south']);
  });

  it('debe llamar "Seleccionar todo" y seleccionar todos los valores', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Abrir dropdown
    const regionButton = screen.getByRole('button', { name: /filtrar por region/i });
    await user.click(regionButton);

    // Hacer click en "Seleccionar todo"
    const selectAllButton = await screen.findByText('Seleccionar todo');
    await user.click(selectAllButton);

    // Debe llamar con todos los valores únicos
    expect(onFilterChange).toHaveBeenCalledWith('region', ['east', 'north', 'south', 'west']);
  });

  it('debe llamar "Limpiar" y deseleccionar todos los valores del dropdown', async () => {
    const user = userEvent.setup();

    render(
      <DashboardFiltersBar
        categoricalFields={['region']}
        filters={{ region: ['north', 'south'] }}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    // Abrir dropdown
    const regionButton = screen.getByRole('button', { name: /filtrar por region/i });
    await user.click(regionButton);

    // Hacer click en "Limpiar"
    const clearButton = await screen.findByText('Limpiar');
    await user.click(clearButton);

    // Debe llamar con array vacío
    expect(onFilterChange).toHaveBeenCalledWith('region', []);
  });

  it('NO debe renderizar nada si no hay campos categóricos', () => {
    const { container } = render(
      <DashboardFiltersBar
        categoricalFields={[]}
        filters={{}}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        dataset={mockDataset}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
