/**
 * AIInsights - Componente para mostrar análisis de IA
 *
 * Features:
 * - Muestra resumen generado por IA si está habilitado
 * - Placeholder temporal mientras no hay integración con LLM
 * - Contexto del usuario visible
 * - Diseño visual con gradiente y animaciones
 *
 * Props:
 * - enabled: Si el análisis de IA está habilitado
 * - userContext: Contexto proporcionado por el  usuario
 * - lastAnalysis: Último análisis generado (placeholder por ahora)
 */

import React from 'react';
import { Bot, Sparkles, Info } from 'lucide-react';
import { Card } from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';

interface AIInsightsProps {
  /** Si el análisis de IA está habilitado */
  enabled: boolean;

  /** Contexto del usuario */
  userContext?: string;

  /** Último análisis generado por IA */
  lastAnalysis?: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  enabled,
  userContext,
  lastAnalysis,
}) => {
  if (!enabled) {
    return null; // No mostrar nada si no está habilitado
  }

  // Placeholder temporal: generar resumen fake basado en datos
  const defaultAnalysis = `
### 📊 Resumen Ejecutivo

Los datos muestran variaciones significativas entre los dos grupos analizados. 
Se observan tendencias positivas en algunos indicadores clave, mientras que otros 
requieren atención inmediata.

### 🎯 Insights Clave

- **Rendimiento General**: Diferencias notables en las métricas principales
- **Áreas de Mejora**: Identificadas oportunidades de optimización
- **Recomendaciones**: Análisis detallado disponible en vista completa

### ⚡ Próximos Pasos

1. Revisar métricas con tendencia negativa
2. Explorar filtros categóricos para drill-down
3. Analizar tendencias temporales en detalle

---

*Análisis generado por IA - En desarrollo. Próximamente integración con LLM para insights personalizados.*
  `.trim();

  const analysisText = lastAnalysis || defaultAnalysis;

  return (
    <Card className="relative overflow-hidden">
      {/* Gradiente decorativo superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violetto-600 to-purple-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Análisis por IA
                <Sparkles className="h-4 w-4 text-violet-500" />
              </h3>
              <p className="text-sm text-muted-foreground">
                Insights automáticos basados en tus datos
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
            Beta
          </Badge>
        </div>

        {/* Contexto del usuario (si existe) */}
        {userContext && (
          <div className="flex gap-2 p-3 rounded-lg bg-muted/50 border border-muted">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Contexto Personalizado:</p>
              <p className="text-muted-foreground">{userContext}</p>
            </div>
          </div>
        )}

        {/* Análisis de IA */}
        <div className="prose prose-sm max-w-none">
          <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
            {analysisText}
          </div>
        </div>

        {/* Footer informativo */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground italic">
            💡 Este análisis se genera automáticamente. La integración completa con LLM está en desarrollo.
          </p>
        </div>
      </div>
    </Card>
  );
};
