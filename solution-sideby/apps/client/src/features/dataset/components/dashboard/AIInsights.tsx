import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Card } from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { Button } from '@/shared/components/ui/button.js';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert.js';
import type { DatasetInsightsResponse } from '../../types/api.types.js';

interface AIInsightsProps {
  enabled: boolean;
  hasRequested: boolean;
  isLoading: boolean;
  isError: boolean;
  onGenerate: () => void;
  onRetry?: () => void;
  data?: DatasetInsightsResponse;
  resetReason?: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  enabled,
  hasRequested,
  isLoading,
  isError,
  onGenerate,
  onRetry,
  data,
  resetReason,
}) => {
  if (!enabled) {
    return null;
  }

  const totalInsights = data?.meta.total ?? data?.insights.length ?? 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Análisis por IA
                <Sparkles className="h-4 w-4 text-violet-500" />
              </h3>
              <p className="text-sm text-muted-foreground">
                Insights automáticos bajo demanda
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
            {totalInsights} insights
          </Badge>
        </div>

        {!hasRequested && (
          <div className="space-y-3">
            {resetReason && (
              <Alert variant="warning">
                <AlertDescription>{resetReason}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              La generación de insights puede tardar unos segundos. Se consulta solo cuando lo solicitas.
            </p>
            <Button type="button" onClick={onGenerate}>
              Generar resumen con IA
            </Button>
          </div>
        )}

        {hasRequested && isLoading && (
          <div className="text-center text-sm text-muted-foreground py-6">
            Generando insights...
          </div>
        )}

        {hasRequested && isError && (
          <Alert variant="destructive">
            <AlertTitle>Error generando insights</AlertTitle>
            <AlertDescription>
              No se pudieron generar insights en este momento. Intenta de nuevo.
            </AlertDescription>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onRetry}
              >
                Reintentar
              </Button>
            )}
          </Alert>
        )}

        {hasRequested && !isLoading && !isError && data?.businessNarrative && (
          <Alert variant="info">
            <AlertTitle>Resumen ejecutivo</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{data.businessNarrative.summary}</p>
              {data.businessNarrative.recommendedActions.length > 0 && (
                <ul className="list-disc pl-4 space-y-1">
                  {data.businessNarrative.recommendedActions.map((action, index) => (
                    <li key={`${action}-${index}`}>{action}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {hasRequested && !isLoading && !isError && data?.insights.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-6">
            No se encontraron insights relevantes para los filtros actuales.
          </div>
        )}

        {hasRequested && !isLoading && !isError && data?.insights.map((insight) => (
          <Alert key={insight.id} variant={insight.severity >= 4 ? 'destructive' : 'default'}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{insight.icon}</span>
              <div className="space-y-1">
                <AlertTitle className="flex items-center gap-2">
                  {insight.title}
                  <Badge variant="outline" className="text-xs">
                    {insight.generatedBy === 'ai-model' ? '🤖 IA' : '📐 Reglas'}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{insight.message}</AlertDescription>
              </div>
            </div>
          </Alert>
        ))}

        {hasRequested && !isLoading && !isError && data?.meta && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            Generado en {data.meta.generationTimeMs}ms
            {data.meta.cacheStatus === 'hit' ? ' • Desde caché' : ''}
          </div>
        )}
      </div>
    </Card>
  );
};
