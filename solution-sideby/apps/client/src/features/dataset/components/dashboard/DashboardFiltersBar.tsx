/**
 * DashboardFiltersBar - Barra de filtros categóricos
 * 
 * Muestra selects para filtrar por campos categóricos del dataset
 */

import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card.js';
import { Label } from '@/shared/components/ui/Label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import type { Dataset, DataRow } from '../../types/api.types.js';

interface DashboardFiltersBarProps {
  categoricalFields: string[];
  filters: Record<string, string>;
  onFilterChange: (field: string, value: string) => void;
  dataset: Dataset;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersBarProps> = ({
  categoricalFields,
  filters,
  onFilterChange,
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

  if (categoricalFields.length === 0) {
    return null; // No mostrar si no hay filtros
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoricalFields.slice(0, 4).map((field) => {
            const uniqueValues = getUniqueValues(field);
            
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor={`filter-${field}`} className="text-xs uppercase text-muted-foreground">
                  {field}
                </Label>
                <Select
                  value={filters[field] || 'all'}
                  onValueChange={(value: string) => onFilterChange(field, value)}
                >
                  <SelectTrigger id={`filter-${field}`} className="w-full min-w-[200px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
