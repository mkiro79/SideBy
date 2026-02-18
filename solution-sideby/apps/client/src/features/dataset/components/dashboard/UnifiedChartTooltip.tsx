import React from 'react';
import { formatKpiValue } from '../../utils/numberFormat.js';

type TooltipValueFormat = 'currency' | 'percentage' | 'number' | 'date' | 'string' | 'text';

interface TooltipItem {
  name?: string;
  value?: string | number;
  color?: string;
  fill?: string;
  stroke?: string;
}

interface UnifiedChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipItem[];
  valueFormatter?: (value: number, name?: string) => string;
  valueFormat?: TooltipValueFormat;
  percentageDecimals?: number;
  labelFormatter?: (label: string | number) => string;
}

export const UnifiedChartTooltip: React.FC<UnifiedChartTooltipProps> = ({
  active,
  label,
  payload,
  valueFormatter,
  valueFormat = 'number',
  percentageDecimals = 2,
  labelFormatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  let resolvedLabel = '';
  if (label !== undefined && label !== null) {
    resolvedLabel = labelFormatter ? labelFormatter(label) : String(label);
  }

  return (
    <div
      className="rounded-md border px-2 py-1.5 text-[11px] shadow-sm"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {resolvedLabel && (
        <div className="mb-1 font-medium text-black">
          {resolvedLabel}
        </div>
      )}

      <div className="space-y-1">
        {payload.map((entry, index) => {
          const bulletColor = entry.color || entry.fill || entry.stroke || '#111827';
          const rawValue = entry.value;
          const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
          let formattedValue = String(rawValue ?? '-');

          if (Number.isFinite(numericValue)) {
            if (valueFormatter) {
              formattedValue = valueFormatter(numericValue, entry.name);
            } else {
              formattedValue = formatKpiValue(numericValue, valueFormat, {
                compact: true,
                percentageDecimals,
              });
            }
          }

          return (
            <div key={`${entry.name ?? 'item'}-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-black">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: bulletColor }}
                />
                <span>{entry.name ?? ''}</span>
              </div>
              <span className="font-medium text-black">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
