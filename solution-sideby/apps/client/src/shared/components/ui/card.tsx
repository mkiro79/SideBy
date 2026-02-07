/**
 * Card - Componente de tarjeta con variantes
 * Soporta diferentes estilos según STYLE_GUIDE: default, elevated, ghost, interactive
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn.js";

// ============================================================================
// CARD VARIANTS
// ============================================================================

const cardVariants = cva(
  "rounded-lg bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border shadow-[var(--shadow-subtle)]",
        elevated: "border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)]",
        ghost: "border-0 shadow-none",
        interactive: "border shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] hover:border-border/80 cursor-pointer",
        dataPrimary: "border-l-4 border-l-data-primary border shadow-[var(--shadow-subtle)]",
        dataComparative: "border-l-4 border-l-data-comparative border shadow-[var(--shadow-subtle)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// ============================================================================
// CARD - Componente principal
// ============================================================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

// ============================================================================
// CARD HEADER
// ============================================================================

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// ============================================================================
// CARD TITLE
// ============================================================================

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ============================================================================
// CARD CONTENT
// ============================================================================

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ============================================================================
// CARD FOOTER
// ============================================================================

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// eslint-disable-next-line react-refresh/only-export-components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
