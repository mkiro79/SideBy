/**
 * DashboardFiltersBar - Barra de filtros categóricos multi-select
 * 
 * RFC-005: https://github.com/mkiro79/SideBy/blob/main/docs/design/RFC-005-DASHBOARD-UX-IMPROVEMENTS.md
 * 
 * Features:
 * - Multi-select dropdowns para cada dimensión categórica
 * - Active filter chips con botón de eliminación individual
 * - Botón "Limpiar todos los filtros"
 * - Contador de filtros activos
 */

import React from 'react';
import { X, Filter, RotateCcw, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card.js';
import { Button } from '@/shared/components/ui/button.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Checkbox } from '@/shared/components/ui/checkbox.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover.js';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/shared/components/ui/command.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import type { Dataset, DataRow } from '../../types/api.types.js';
import type { DateGranularity } from '../../utils/dateUmbrella.js';

interface DashboardFiltersBarProps {
  categoricalFields: string[];
  filters: Record<string, string[]>;  // ✅ Multi-select con arrays
  onFilterChange: (field: string, values: string[]) => void;
  onClearFilters: () => void;
  dataset: Dataset;
  
  /** Filtro de período relativo (opcional) */
  periodFilter?: { from?: number; to?: number };
  onPeriodFilterChange: (filter?: { from?: number; to?: number }) => void;
  
  /** Granularidad actual para determinar rango de períodos */
  granularity: DateGranularity;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersBarProps> = ({
  categoricalFields,
  filters,
  onFilterChange,
  onClearFilters,
  dataset,
  periodFilter,
  onPeriodFilterChange,
  granularity,
}) => {
  /**
   * Obtiene valores únicos para cada campo categórico
   */
  const getUniqueValues = (field: string): string[] => {
    if (!dataset.data) return [];
    const uniqueSet = new Set<string>();
    dataset.data.forEach((row: DataRow) => {
      if (row[field]) {
        uniqueSet.add(String(row[field]));
      }
    });
    return Array.from(uniqueSet).sort();
  };

  // Contar filtros activos
  const activeFiltersCount = React.useMemo(() => {
    const categoricalCount = Object.values(filters).reduce((acc, values) => acc + values.length, 0);
    const periodCount = (periodFilter?.from !== undefined || periodFilter?.to !== undefined) ? 1 : 0;
    return categoricalCount + periodCount;
  }, [filters, periodFilter]);

  if (categoricalFields.length === 0) {
    return null; // No mostrar si no hay filtros disponibles
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header con contador y botón limpiar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" aria-label={`${activeFiltersCount} filtros activos`}>
                  {activeFiltersCount} activos
                </Badge>
              )}
            </div>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar todos los filtros"
              >
                <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Multi-select dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {categoricalFields.slice(0, 4).map((field) => {
              const uniqueValues = getUniqueValues(field);
              const selectedValues = filters[field] || [];
              
              return (
                <MultiSelectDropdown
                  key={field}
                  field={field}
                  selectedValues={selectedValues}
                  availableValues={uniqueValues}
                  onValuesChange={(values) => onFilterChange(field, values)}
                />
              );
            })}
            
            {/* Filtro de Período */}
            <PeriodFilterDropdown
              periodFilter={periodFilter}
              granularity={granularity}
              onPeriodFilterChange={onPeriodFilterChange}
            />
          </div>

          {/* Active filters chips */}
          {activeFiltersCount > 0 && (
            <div 
              className="flex flex-wrap gap-2 pt-2 border-t"
              aria-label="Filtros activos"
              role="region"
            >
              {Object.entries(filters).map(([field, values]) =>
                values.map((value) => (
                  <Badge
                    key={`${field}-${value}`}
                    variant="default"
                    className="gap-1 pr-1"
                  >
                    <span className="text-xs">{field}: {value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        const newValues = values.filter((v) => v !== value);
                        onFilterChange(field, newValues);
                      }}
                      aria-label={`Eliminar filtro ${field}: ${value}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </Badge>
                ))
              )}
              
              {/* Chip para período */}
              {(periodFilter?.from !== undefined || periodFilter?.to !== undefined) && (
                <Badge variant="default" className="gap-1 pr-1">
                  <span className="text-xs">
                    Período: {formatPeriodRange(periodFilter, granularity)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onPeriodFilterChange(undefined)}
                    aria-label="Eliminar filtro de período"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MultiSelectDropdown Component
// ============================================================================

interface MultiSelectDropdownProps {
  field: string;
  selectedValues: string[];
  availableValues: string[];
  onValuesChange: (values: string[]) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  field,
  selectedValues,
  availableValues,
  onValuesChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const selectAll = () => {
    onValuesChange(availableValues);
    setIsOpen(false);
  };

  const clearAll = () => {
    onValuesChange([]);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 border-dashed"
          aria-label={`Filtrar por ${field}. ${selectedValues.length > 0 ? `${selectedValues.length} seleccionados` : 'Ninguno seleccionado'}`}
        >
          {field}
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedValues.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${field}...`} />
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup>
            <CommandItem onSelect={selectAll}>
              <span className="font-medium">Seleccionar todo</span>
            </CommandItem>
            <CommandItem onSelect={clearAll}>
              <span className="font-medium">Limpiar</span>
            </CommandItem>
            <CommandSeparator />
            {(() => {
              const selectedValuesSet = new Set(selectedValues);
              return availableValues.map((value) => {
                const isSelected = selectedValuesSet.has(value);
                return (
                  <CommandItem
                    key={value}
                    onSelect={() => toggleValue(value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      className="mr-2"
                      aria-label={`${isSelected ? 'Deseleccionar' : 'Seleccionar'} ${value}`}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                    <span>{value}</span>
                  </CommandItem>
                );
              });
            })()}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ============================================================================
// PeriodFilterDropdown Component
// ============================================================================

interface PeriodFilterDropdownProps {
  periodFilter?: { from?: number; to?: number };
  granularity: DateGranularity;
  onPeriodFilterChange: (filter?: { from?: number; to?: number }) => void;
}

const PeriodFilterDropdown: React.FC<PeriodFilterDropdownProps> = ({
  periodFilter,
  granularity,
  onPeriodFilterChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const { presets, maxValue, labels } = getPeriodConfig(granularity);
  const hasFilter = periodFilter?.from !== undefined || periodFilter?.to !== undefined;
  
  const applyPreset = (from: number, to: number) => {
    onPeriodFilterChange({ from, to });
    setIsOpen(false);
  };
  
  const clearFilter = () => {
    onPeriodFilterChange(undefined);
    setIsOpen(false);
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 border-dashed"
          aria-label={`Filtrar por período. ${hasFilter ? 'Filtro activo' : 'Sin filtrar'}`}
        >
          <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
          Período
          {hasFilter && (
            <Badge variant="secondary" className="ml-2">
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.from, preset.to)}
                  className="justify-start"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Rango personalizado</h4>
            <div className="flex items-center gap-2">
              <Select
                value={periodFilter?.from?.toString()}
                onValueChange={(val: string) => 
                  onPeriodFilterChange({ 
                    from: parseInt(val), 
                    to: periodFilter?.to 
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Desde..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxValue }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {labels[num - 1] || num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-muted-foreground">-</span>
              
              <Select
                value={periodFilter?.to?.toString()}
                onValueChange={(val: string) => 
                  onPeriodFilterChange({
                    from: periodFilter?.from, 
                    to: parseInt(val) 
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Hasta..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxValue }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {labels[num - 1] || num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilter} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar filtro
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene configuración de períodos según granularidad
 */
function getPeriodConfig(granularity: DateGranularity) {
  switch (granularity) {
    case 'quarters':
      return {
        presets: [
          { label: 'Q1', from: 1, to: 1 },
          { label: 'Q2', from: 2, to: 2 },
          { label: 'Q3', from: 3, to: 3 },
          { label: 'Q4', from: 4, to: 4 },
          { label: 'H1', from: 1, to: 2 },
          { label: 'H2', from: 3, to: 4 },
        ],
        maxValue: 4,
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      };
    
    case 'months':
      return {
        presets: [
          { label: 'Q1', from: 1, to: 3 },
          { label: 'Q2', from: 4, to: 6 },
          { label: 'Q3', from: 7, to: 9 },
          { label: 'Q4', from: 10, to: 12 },
          { label: 'H1', from: 1, to: 6 },
          { label: 'H2', from: 7, to: 12 },
        ],
        maxValue: 12,
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      };
    
    case 'weeks':
      return {
        presets: [
          { label: 'Mes 1', from: 1, to: 4 },
          { label: 'Mes 2', from: 5, to: 8 },
          { label: 'Mes 3', from: 9, to: 13 },
          { label: 'Q1', from: 1, to: 13 },
          { label: 'Q2', from: 14, to: 26 },
          { label: 'H1', from: 1, to: 26 },
        ],
        maxValue: 52,
        labels: Array.from({ length: 52 }, (_, i) => `Sem ${i + 1}`),
      };
    
    case 'days':
    default:
      return {
        presets: [
          { label: 'Ene', from: 1, to: 31 },
          { label: 'Feb', from: 32, to: 59 },
          { label: 'Mar', from: 60, to: 90 },
          { label: 'Q1', from: 1, to: 90 },
          { label: 'Q2', from: 91, to: 181 },
          { label: 'H1', from: 1, to: 181 },
        ],
        maxValue: 365,
        labels: Array.from({ length: 365 }, (_, i) => `Día ${i + 1}`),
      };
  }
}

/**
 * Formatea el rango de período para el chip activo
 */
function formatPeriodRange(
  periodFilter: { from?: number; to?: number }, 
  granularity: DateGranularity
): string {
  const { labels } = getPeriodConfig(granularity);
  
  const fromLabel = periodFilter.from !== undefined 
    ? labels[periodFilter.from - 1] || periodFilter.from 
    : '?';
    
  const toLabel = periodFilter.to !== undefined 
    ? labels[periodFilter.to - 1] || periodFilter.to 
    : '?';
  
  if (periodFilter.from !== undefined && periodFilter.to !== undefined) {
    if (periodFilter.from === periodFilter.to) {
      return String(fromLabel);
    }
    return `${fromLabel} - ${toLabel}`;
  }
  
  if (periodFilter.from !== undefined) {
    return `Desde ${fromLabel}`;
  }
  
  if (periodFilter.to !== undefined) {
    return `Hasta ${toLabel}`;
  }
  
  return 'Personalizado';
}
