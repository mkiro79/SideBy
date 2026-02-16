/**
 * KPICard Component
 * 
 * Tarjeta para mostrar un KPI comparativo con:
 * - Valor actual vs valor comparativo
 * - Cambio porcentual (badge con trend icon)
 * - Ícono del KPI
 * 
 * Basado en el diseño de SideBy-Design.
 * 
 * @see {@link docs/STYLE_GUIDE_SIDEBY.md} - Guía de estilos
 */

import { Card, CardContent } from '@/shared/components/ui/card.js';
import { Badge } from '@/shared/components/ui/badge.js';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn.js';

// ============================================================================
// TYPES
// ============================================================================

export interface KPICardProps {
  /** Título del KPI (ej: "Ingresos Totales") */
  title: string;
  
  /** Valor actual formateado (ej: "$245,000") */
  currentValue: string | number;
  
  /** Valor comparativo formateado (ej: "$198,000") */
  comparativeValue: string | number;
  
  /** Cambio porcentual (positivo o negativo) */
  percentageChange: number;
  
  /** Ícono Lucide para el KPI */
  icon: LucideIcon;
  
  /** Clases CSS adicionales */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KPICard({
  title,
  currentValue,
  comparativeValue,
  percentageChange,
  icon: Icon,
  className,
}: KPICardProps) {
  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;

  /**
   * Retorna el ícono de tendencia basado en el cambio porcentual
   */
  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp className="h-3 w-3" />;
    if (isNegative) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  /**
   * Retorna la variante del badge según el cambio porcentual
   */
  const getBadgeVariant = (): 'success' | 'destructive' | 'secondary' => {
    if (isPositive) return 'success';
    if (isNegative) return 'destructive';
    return 'secondary';
  };

  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          {/* Valores y comparación */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight">
                {currentValue}
              </p>
              <p className="text-sm text-muted-foreground">
                vs. {comparativeValue}
              </p>
            </div>
          </div>

          {/* Ícono y Badge de tendencia */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <Badge variant={getBadgeVariant()} className="gap-1">
              {getTrendIcon()}
              {isFinite(percentageChange) ? (
                <>
                  {isPositive ? '+' : ''}
                  {percentageChange.toFixed(1)}%
                </>
              ) : (
                'N/A'
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
