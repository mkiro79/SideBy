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
import { X, Filter, RotateCcw } from 'lucide-react';
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
import type { Dataset, DataRow } from '../../types/api.types.js';

interface DashboardFiltersBarProps {
  categoricalFields: string[];
  filters: Record<string, string[]>;  // ✅ Multi-select con arrays
  onFilterChange: (field: string, values: string[]) => void;
  onClearFilters: () => void;
  dataset: Dataset;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersBarProps> = ({
  categoricalFields,
  filters,
  onFilterChange,
  onClearFilters,
  dataset,
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
    return Object.values(filters).reduce((acc, values) => acc + values.length, 0);
  }, [filters]);

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
          </div>

          {/* Active filters chips */}
          {activeFiltersCount > 0 && (
            <div 
              className="flex flex-wrap gap-2 pt-2 border-t"
              arial-label="Filtros activos"
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
            {availableValues.map((value) => {
              const isSelected = selectedValues.includes(value);
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
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
