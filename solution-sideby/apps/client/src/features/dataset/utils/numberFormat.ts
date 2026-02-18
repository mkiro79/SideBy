/**
 * Formateo de numeros para el dashboard
 * - Usa K/M para valores grandes
 * - Centraliza formato por tipo de KPI
 */

type KPIValueFormat =
  | "currency"
  | "percentage"
  | "number"
  | "date"
  | "string"
  | "text";

interface FormatOptions {
  compact?: boolean;
  locale?: string;
  currency?: string;
  percentageDecimals?: number;
}

const DEFAULT_LOCALE = "es-ES";
const DEFAULT_CURRENCY = "EUR";

export const formatCompactNumber = (
  value: number,
  options: Pick<FormatOptions, "locale"> = {},
): string => {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const absValue = Math.abs(value);

  if (absValue >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted}M`;
  }

  if (absValue >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted}K`;
  }

  return new Intl.NumberFormat(locale).format(value);
};

export const formatKpiValue = (
  value: number,
  format: KPIValueFormat,
  options: FormatOptions = {},
): string => {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const currency = options.currency ?? DEFAULT_CURRENCY;
  const percentageDecimals = options.percentageDecimals ?? 1;
  const isCompact = options.compact ?? false;

  if (!Number.isFinite(value)) {
    return "—";
  }

  switch (format) {
    case "currency": {
      if (isCompact && Math.abs(value) >= 1_000) {
        return `${formatCompactNumber(value, { locale })} €`;
      }

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }

    case "percentage":
      return `${value.toFixed(percentageDecimals)}%`;

    case "number":
      return isCompact
        ? formatCompactNumber(value, { locale })
        : new Intl.NumberFormat(locale).format(value);

    case "date":
    case "string":
    case "text":
      return String(value);

    default:
      return String(value);
  }
};
