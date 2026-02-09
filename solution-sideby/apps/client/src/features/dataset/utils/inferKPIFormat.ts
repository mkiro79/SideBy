/**
 * Utility para inferir el formato de KPI basándose en el nombre de la columna
 * 
 * Aplica heurísticas para determinar si una métrica debería formatearse como:
 * - currency: columnas relacionadas con dinero/ventas
 * - percentage: columnas relacionadas con porcentajes/tasas
 * - number: fallback por defecto para métricas numéricas
 * 
 * @module inferKPIFormat
 */

import type { KPIFormat } from "../types/wizard.types.js";

/**
 * Infiere el formato apropiado para un KPI basándose en el nombre de la columna
 * 
 * @param columnName - Nombre de la columna a analizar
 * @returns El formato inferido (currency, percentage, o number como default)
 * 
 * @example
 * ```typescript
 * inferKPIFormat("total_ventas") // => "currency"
 * inferKPIFormat("tasa_conversion") // => "percentage"
 * inferKPIFormat("cantidad") // => "number"
 * ```
 */
export function inferKPIFormat(columnName: string): KPIFormat {
  const normalized = columnName.toLowerCase();

  // Detectar currency (dinero, ventas, precios, costos, ingresos)
  const currencyPatterns = [
    /precio/i,
    /costo/i,
    /gasto/i,
    /ingreso/i,
    /venta/i,
    /revenue/i,
    /sales/i,
    /price/i,
    /cost/i,
    /amount/i,
    /monto/i,
    /importe/i,
    /factura/i,
    /pago/i,
    /payment/i,
    /€/,
    /\$/,
    /usd/i,
    /eur/i,
  ];

  if (currencyPatterns.some((pattern) => pattern.test(normalized))) {
    return "currency";
  }

  // Detectar percentage (tasas, porcentajes, ratios expresados en %)
  const percentagePatterns = [
    /tasa/i,
    /ratio/i,
    /rate/i,
    /porcentaje/i,
    /percent/i,
    /%/,
    /conversion/i,
    /margen/i,
    /margin/i,
    /crecimiento/i,
    /growth/i,
    /variacion/i,
    /variation/i,
  ];

  if (percentagePatterns.some((pattern) => pattern.test(normalized))) {
    return "percentage";
  }

  // Default: number (más neutral para métricas genéricas)
  return "number";
}
