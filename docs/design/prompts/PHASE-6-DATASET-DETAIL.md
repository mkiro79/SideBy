# 🚀 Prompt para el Agente Frontend - Phase 6: DatasetDetail Edit Page (RFC-004 - Día 4-5)

---

## 📋 Prerequisitos

✅ React Query hooks implementados (`useDataset`, `useUpdateDataset`)  
✅ Feature flag `VITE_FEATURE_DATASET_EDIT_ENABLED=true`  
✅ Ruta `/datasets/:id` configurada en React Router  
✅ Backend endpoint `PATCH /api/datasets/:id` funcional

---

## 🎯 Objetivo de esta Fase

Implementar la página de edición de datasets con formulario estructurado en secciones:

1. **General Info**: Nombre y descripción
2. **Group Configuration**: Labels y colores de grupos comparativos
3. **KPI Fields**: Labels y formatos de campos configurables
4. **AI Configuration**: Habilitación y contexto de usuario

**Tiempo estimado:** 5-6 horas

---

## ✅ Task 6.1: Instalar dependencias de formularios

### Instalar React Hook Form + Zod

```bash
cd solution-sideby/apps/client

# React Hook Form para gestión de formularios
npm install react-hook-form

# Zod para validación de esquemas
npm install zod

# Integración Zod + React Hook Form
npm install @hookform/resolvers

# Color picker component (opcional, o usar input[type="color"])
npm install react-colorful
```

---

## ✅ Task 6.2: Definir esquema de validación

### Crear archivo de validación

**Archivo:** `solution-sideby/apps/client/src/features/dataset/schemas/datasetEdit.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Schema de validación para edición de datasets
 * 
 * Validaciones:
 * - Nombre requerido, min 3 caracteres
 * - Descripción opcional, max 500 caracteres
 * - Labels de grupos requeridos
 * - Colores en formato hexadecimal
 * - Labels de KPI fields sin validación estricta (son opcionales)
 * - AI context max 1000 caracteres
 */
export const datasetEditSchema = z.object({
  // General Info
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),

  // Group Configuration
  groupA: z.object({
    label: z
      .string()
      .min(1, 'El label del Grupo A es requerido')
      .max(50, 'El label no puede exceder 50 caracteres'),
    
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser formato hexadecimal (#RRGGBB)'),
  }),

  groupB: z.object({
    label: z
      .string()
      .min(1, 'El label del Grupo B es requerido')
      .max(50, 'El label no puede exceder 50 caracteres'),
    
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser formato hexadecimal (#RRGGBB)'),
  }),

  // KPI Fields
  kpiFields: z.array(
    z.object({
      originalName: z.string(), // No editable
      label: z
        .string()
        .max(100, 'El label no puede exceder 100 caracteres')
        .optional(),
      
      format: z
        .enum(['number', 'currency', 'percentage', 'text'])
        .optional(),
    })
  ),

  // AI Configuration
  aiEnabled: z.boolean(),
  aiUserContext: z
    .string()
    .max(1000, 'El contexto no puede exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

/**
 * Tipo TypeScript inferido del schema
 */
export type DatasetEditFormData = z.infer<typeof datasetEditSchema>;
```

---

## ✅ Task 6.3: Crear componente de formulario

### Paso 1: Estructura principal del formulario

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/DatasetDetail.tsx`

```typescript
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { toast } from '@/hooks/use-toast';

import { useDataset } from '../hooks/useDataset';
import { useUpdateDataset } from '../hooks/useUpdateDataset';
import { datasetEditSchema, DatasetEditFormData } from '../schemas/datasetEdit.schema';
import { Dataset } from '../models/Dataset';

import { GeneralInfoFields } from '../components/edit/GeneralInfoFields';
import { GroupConfigFields } from '../components/edit/GroupConfigFields';
import { KPIFieldsTable } from '../components/edit/KPIFieldsTable';
import { AIConfigFields } from '../components/edit/AIConfigFields';

/**
 * Convierte un Dataset a formato de formulario
 */
const datasetToFormData = (dataset: Dataset): DatasetEditFormData => {
  return {
    name: dataset.meta.name,
    description: dataset.meta.description || '',
    groupA: {
      label: dataset.sourceConfig.groupA.label,
      color: dataset.sourceConfig.groupA.color,
    },
    groupB: {
      label: dataset.sourceConfig.groupB.label,
      color: dataset.sourceConfig.groupB.color,
    },
    kpiFields: dataset.schemaMapping?.kpiFields || [],
    aiEnabled: dataset.aiConfig?.enabled || false,
    aiUserContext: dataset.aiConfig?.userContext || '',
  };
};

/**
 * Página de edición de un dataset
 * 
 * Features:
 * - Carga dataset con React Query
 * - Formulario con React Hook Form + Zod
 * - Secciones organizadas (General, Groups, KPIs, AI)
 * - Optimistic update al guardar
 * - Navegación de regreso a lista
 */
export const DatasetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // React Query hooks
  const { data: dataset, isLoading, error } = useDataset(id || null);
  const updateMutation = useUpdateDataset();

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<DatasetEditFormData>({
    resolver: zodResolver(datasetEditSchema),
    defaultValues: {
      kpiFields: [],
      aiEnabled: false,
    },
  });

  // Cargar datos en el form cuando el dataset se obtiene
  useEffect(() => {
    if (dataset) {
      reset(datasetToFormData(dataset));
    }
  }, [dataset, reset]);

  /**
   * Maneja el submit del formulario
   */
  const onSubmit = async (formData: DatasetEditFormData) => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({
        id,
        updates: {
          meta: {
            name: formData.name,
            description: formData.description || undefined,
          },
          sourceConfig: {
            groupA: formData.groupA,
            groupB: formData.groupB,
          },
          schemaMapping: {
            kpiFields: formData.kpiFields,
          },
          aiConfig: {
            enabled: formData.aiEnabled,
            userContext: formData.aiUserContext || undefined,
          },
        },
      });

      toast({
        title: 'Dataset actualizado',
        description: 'Los cambios se guardaron correctamente.',
      });

      // Volver a la lista después de guardar
      navigate('/datasets');
    } catch (err) {
      toast({
        title: 'Error al guardar',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  /**
   * Navega de regreso a la lista
   */
  const handleBack = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Tienes cambios sin guardar. ¿Estás seguro de salir?'
      );
      if (!confirmed) return;
    }
    navigate('/datasets');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error al cargar dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Dataset no encontrado'}
            </p>
            <Button onClick={handleBack}>Volver a la lista</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold">Editar Dataset</h1>
                  <p className="text-sm text-muted-foreground">
                    Modifica la configuración de tu dataset
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>

            {/* Form Sections */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* General Info */}
              <GeneralInfoFields register={register} errors={errors} />

              {/* Group Configuration */}
              <GroupConfigFields control={control} errors={errors} />

              {/* KPI Fields */}
              <KPIFieldsTable control={control} />

              {/* AI Configuration */}
              <AIConfigFields control={control} />
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
```

---

## ✅ Task 6.4: Crear componentes de secciones del formulario

### Sección 1: General Info

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/edit/GeneralInfoFields.tsx`

```typescript
import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatasetEditFormData } from '../../schemas/datasetEdit.schema';

interface GeneralInfoFieldsProps {
  register: UseFormRegister<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
}

/**
 * Sección de información general (nombre, descripción)
 */
export const GeneralInfoFields: React.FC<GeneralInfoFieldsProps> = ({
  register,
  errors,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Información General</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre del Dataset <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ej: Comparación Anual 2024 vs 2023"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Describe el propósito de este dataset..."
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Sección 2: Group Configuration

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/edit/GroupConfigFields.tsx`

```typescript
import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatasetEditFormData } from '../../schemas/datasetEdit.schema';

interface GroupConfigFieldsProps {
  control: Control<DatasetEditFormData>;
  errors: FieldErrors<DatasetEditFormData>;
}

/**
 * Sección de configuración de grupos comparativos
 */
export const GroupConfigFields: React.FC<GroupConfigFieldsProps> = ({
  control,
  errors,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuración de Grupos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Group A */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Grupo A</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="groupA.label"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="groupA-label">
                    Label <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="groupA-label"
                    {...field}
                    placeholder="Ej: 2024"
                  />
                  {errors.groupA?.label && (
                    <p className="text-sm text-destructive">
                      {errors.groupA.label.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="groupA.color"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="groupA-color">
                    Color <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="groupA-color"
                      {...field}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  {errors.groupA?.color && (
                    <p className="text-sm text-destructive">
                      {errors.groupA.color.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Group B */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Grupo B</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="groupB.label"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="groupB-label">
                    Label <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="groupB-label"
                    {...field}
                    placeholder="Ej: 2023"
                  />
                  {errors.groupB?.label && (
                    <p className="text-sm text-destructive">
                      {errors.groupB.label.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="groupB.color"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="groupB-color">
                    Color <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="groupB-color"
                      {...field}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#ef4444"
                      className="flex-1"
                    />
                  </div>
                  {errors.groupB?.color && (
                    <p className="text-sm text-destructive">
                      {errors.groupB.color.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Sección 3: KPI Fields Table

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/edit/KPIFieldsTable.tsx`

```typescript
import React from 'react';
import { Control, Controller, useFieldArray } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatasetEditFormData } from '../../schemas/datasetEdit.schema';

interface KPIFieldsTableProps {
  control: Control<DatasetEditFormData>;
}

/**
 * Tabla de campos KPI configurables
 */
export const KPIFieldsTable: React.FC<KPIFieldsTableProps> = ({ control }) => {
  const { fields } = useFieldArray({
    control,
    name: 'kpiFields',
  });

  if (fields.length === 0) {
    return null; // No hay campos configurables
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campos Configurables (KPIs)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium">
                  Nombre Original
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium">
                  Label Personalizado
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium">
                  Formato
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3 text-sm text-muted-foreground">
                    {field.originalName}
                  </td>
                  <td className="py-3 px-3">
                    <Controller
                      name={`kpiFields.${index}.label`}
                      control={control}
                      render={({ field: ctrlField }) => (
                        <Input
                          {...ctrlField}
                          placeholder={field.originalName}
                          className="h-9"
                        />
                      )}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Controller
                      name={`kpiFields.${index}.format`}
                      control={control}
                      render={({ field: ctrlField }) => (
                        <Select
                          value={ctrlField.value || 'text'}
                          onValueChange={ctrlField.onChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="currency">Moneda</SelectItem>
                            <SelectItem value="percentage">Porcentaje</SelectItem>
                            <SelectItem value="text">Texto</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Sección 4: AI Configuration

**Archivo:** `solution-sideby/apps/client/src/features/dataset/components/edit/AIConfigFields.tsx`

```typescript
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatasetEditFormData } from '../../schemas/datasetEdit.schema';

interface AIConfigFieldsProps {
  control: Control<DatasetEditFormData>;
}

/**
 * Sección de configuración de AI
 */
export const AIConfigFields: React.FC<AIConfigFieldsProps> = ({ control }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuración de IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Enabled Switch */}
        <Controller
          name="aiEnabled"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ai-enabled">Habilitar IA</Label>
                <p className="text-sm text-muted-foreground">
                  Activa insights generados por IA en el dashboard
                </p>
              </div>
              <Switch
                id="ai-enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />

        {/* AI User Context */}
        <Controller
          name="aiUserContext"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="ai-context">Contexto de Usuario (opcional)</Label>
              <Textarea
                id="ai-context"
                {...field}
                placeholder="Proporciona contexto adicional para la IA (ej: industria, objetivos específicos)..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Este contexto ayuda a la IA a generar insights más relevantes
              </p>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};
```

---

## ✅ Task 6.5: Tests del formulario

### Test de validación del schema

**Archivo:** `solution-sideby/apps/client/src/features/dataset/schemas/__tests__/datasetEdit.schema.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { datasetEditSchema } from '../datasetEdit.schema';

describe('datasetEditSchema', () => {
  it('debe validar datos correctos', () => {
    const validData = {
      name: 'Test Dataset',
      description: 'Test description',
      groupA: {
        label: '2024',
        color: '#3b82f6',
      },
      groupB: {
        label: '2023',
        color: '#ef4444',
      },
      kpiFields: [],
      aiEnabled: false,
      aiUserContext: '',
    };

    const result = datasetEditSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('debe rechazar nombre muy corto', () => {
    const invalidData = {
      name: 'AB', // < 3 caracteres
      groupA: { label: '2024', color: '#3b82f6' },
      groupB: { label: '2023', color: '#ef4444' },
      kpiFields: [],
      aiEnabled: false,
    };

    const result = datasetEditSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('debe rechazar color inválido', () => {
    const invalidData = {
      name: 'Valid Name',
      groupA: { label: '2024', color: 'red' }, // Not hex
      groupB: { label: '2023', color: '#ef4444' },
      kpiFields: [],
      aiEnabled: false,
    };

    const result = datasetEditSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### Test del componente DatasetDetail

**Archivo:** `solution-sideby/apps/client/src/features/dataset/pages/__tests__/DatasetDetail.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DatasetDetail } from '../DatasetDetail';
import { createQueryClientWrapper } from '@/test/utils/react-query';
import * as api from '../../services/datasets.api';

const mockDataset = {
  id: '123',
  ownerId: 'user1',
  status: 'ready' as const,
  meta: {
    name: 'Test Dataset',
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  sourceConfig: {
    groupA: { label: '2024', color: '#3b82f6', originalFileName: 'a.csv', rowCount: 100 },
    groupB: { label: '2023', color: '#ef4444', originalFileName: 'b.csv', rowCount: 100 },
  },
  schemaMapping: {
    kpiFields: [
      { originalName: 'revenue', label: 'Ingresos', format: 'currency' as const },
    ],
  },
  aiConfig: {
    enabled: false,
    userContext: '',
  },
  data: [],
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/datasets/123']}>
      <Routes>
        <Route path="/datasets/:id" element={component} />
      </Routes>
    </MemoryRouter>,
    { wrapper: createQueryClientWrapper() }
  );
};

describe('DatasetDetail', () => {
  it('debe cargar y mostrar el dataset', async () => {
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);

    renderWithRouter(<DatasetDetail />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Dataset')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
  });

  it('debe guardar cambios correctamente', async () => {
    vi.spyOn(api, 'getDataset').mockResolvedValue(mockDataset);
    vi.spyOn(api, 'updateDataset').mockResolvedValue({ ...mockDataset, meta: { ...mockDataset.meta, name: 'Updated Name' } });

    renderWithRouter(<DatasetDetail />);

    // Esperar carga
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Dataset')).toBeInTheDocument();
    });

    // Editar nombre
    const nameInput = screen.getByLabelText(/Nombre del Dataset/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');

    // Guardar
    const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });
    await userEvent.click(saveButton);

    // Verificar API call
    await waitFor(() => {
      expect(api.updateDataset).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          meta: expect.objectContaining({
            name: 'Updated Name',
          }),
        })
      );
    });
  });

  it('debe mostrar error si falla la carga', async () => {
    vi.spyOn(api, 'getDataset').mockRejectedValue(new Error('Network error'));

    renderWithRouter(<DatasetDetail />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar dataset')).toBeInTheDocument();
    });
  });
});
```

**Ejecutar tests:**
```bash
npm test -- DatasetDetail
```

---

## ✅ Task 6.6: Validación Manual

### Checklist de funcionalidades

```bash
# 1. Iniciar servers
cd solution-sideby/apps/api
npm run dev

cd solution-sideby/apps/client
npm run dev
```

**Flujo a probar:**

1. **Navegar a edición:**
   - [ ] Desde DatasetsList, click "Editar"
   - [ ] URL cambia a `/datasets/{id}`
   - [ ] Formulario carga con datos del backend

2. **Editar General Info:**
   - [ ] Cambiar nombre → validación min 3 caracteres
   - [ ] Cambiar descripción → contador de caracteres (opcional)
   - [ ] Botón "Guardar" se habilita (isDirty)

3. **Editar Group Config:**
   - [ ] Cambiar label de Grupo A
   - [ ] Usar color picker → cambio visual inmediato
   - [ ] Validación de formato hexadecimal

4. **Editar KPI Fields:**
   - [ ] Cambiar labels personalizados
   - [ ] Cambiar formato (number, currency, percentage, text)
   - [ ] Tabla responsive en móvil

5. **Editar AI Config:**
   - [ ] Toggle switch AI enabled
   - [ ] Textarea de contexto (max 1000 chars)

6. **Guardar cambios:**
   - [ ] Click "Guardar Cambios"
   - [ ] Loading spinner aparece
   - [ ] Toast de éxito
   - [ ] Redirección a `/datasets`
   - [ ] Lista se actualiza automáticamente (cache invalidation)

7. **Volver atrás sin guardar:**
   - [ ] Hacer cambios en el form
   - [ ] Click "Volver"
   - [ ] Confirmación de pérdida de datos
   - [ ] Si cancelas, permaneces en el form
   - [ ] Si aceptas, vuelves a la lista

---

## 🎯 Checklist del Día 4-5

- [ ] Dependencies instaladas (react-hook-form, zod, @hookform/resolvers)
- [ ] Schema de validación creado
- [ ] Componente DatasetDetail implementado
- [ ] 4 secciones del formulario implementadas (General, Groups, KPIs, AI)
- [ ] Validación en tiempo real funcionando
- [ ] Optimistic update al guardar
- [ ] Tests de schema pasando
- [ ] Tests del componente pasando
- [ ] Validación manual completada (7 flujos)

---

## 📍 Estado Esperado al Finalizar

✅ **Formulario de edición completo**  
✅ **Validación con Zod funcionando**  
✅ **React Hook Form con control total**  
✅ **Color pickers funcionales**  
✅ **Optimistic updates en mutations**  
✅ **UX profesional** (loading, errors, confirmations)

---

## 🚨 Troubleshooting

### Problema: Form no se llena con datos del backend

**Causa:** useEffect no está actualizando el form

**Solución:** Verificar que `reset(datasetToFormData(dataset))` se ejecuta cuando `dataset` cambia

---

### Problema: Color picker no actualiza el input de texto

**Causa:** Falta sincronización bidireccional

**Solución:** Usar Controller con ambos inputs sincronizados:
```typescript
<input type="color" {...field} />
<Input value={field.value} onChange={(e) => field.onChange(e.target.value)} />
```

---

### Problema: isDirty siempre es false

**Causa:** defaultValues no coinciden con el schema

**Solución:** Asegurar que `datasetToFormData` devuelve el formato exacto del schema

---

## ✨ Siguiente Paso

**Ahora implementaremos el dashboard con templates:**  
📄 **`docs/design/prompts/PHASE-7-DASHBOARD-TEMPLATES.md`**

---

## 📝 Commit Sugerido

```bash
git add .
git commit -m "feat(datasets): implement edit page with sections

- Created DatasetDetail page with React Hook Form + Zod
- Implemented 4 form sections: General, Groups, KPIs, AI
- Added color pickers for group customization
- Implemented KPI fields table with format selection
- Validated all form fields with Zod schema
- Added optimistic updates on save
- All tests passing (schema + component)

UX improvements:
- isDirty detection prevents accidental data loss
- Real-time validation feedback
- Professional loading and error states
"
```

---

**¡Excelente! La página de edición está lista. Siguiente paso: el dashboard con templates. 🚀**
