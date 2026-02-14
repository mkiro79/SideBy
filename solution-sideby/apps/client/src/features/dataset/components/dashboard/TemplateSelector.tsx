/**
 * TemplateSelector - Selector de plantillas de dashboard
 * 
 * Permite cambiar entre las vistas: Executive, Trends, Detailed
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select.js';
import { BarChart3, TrendingUp, Table } from 'lucide-react';
import type { DashboardTemplateId } from '../../types/dashboard.types.js';
import { DASHBOARD_TEMPLATES } from '../../types/dashboard.types.js';

interface TemplateSelectorProps {
  selectedTemplate: DashboardTemplateId;
  onSelectTemplate: (template: DashboardTemplateId) => void;
}

const ICON_MAP = {
  BarChart3,
  TrendingUp,
  Table,
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  return (
    <Select value={selectedTemplate} onValueChange={onSelectTemplate}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Seleccionar vista..." />
      </SelectTrigger>
      <SelectContent>
        {Object.values(DASHBOARD_TEMPLATES).map((template) => {
          const Icon = ICON_MAP[template.icon as keyof typeof ICON_MAP];
          return (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
