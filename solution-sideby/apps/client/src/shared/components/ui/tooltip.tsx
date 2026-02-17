import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn.js";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

/**
 * Tooltip UI reutilizable.
 * Muestra contenido en hover y focus para mejorar accesibilidad.
 */
export const Tooltip = ({ content, children, className }: TooltipProps) => {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}

      <span
        role="tooltip"
        className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity transition-transform duration-150 group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-[calc(100%+0.125rem)] group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:-translate-y-[calc(100%+0.125rem)]"
      >
        {content}
      </span>
    </span>
  );
};
