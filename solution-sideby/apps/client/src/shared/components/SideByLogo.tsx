/**
 * SideByLogo - Isotipo de SideBy
 *
 * SVG inline para mantener coherencia con el favicon.
 * Fondo azul, barras blancas, ejes naranja.
 */

interface SideByLogoProps {
  /** Tamaño en píxeles (width y height). Por defecto 32. */
  size?: number;
  className?: string;
}

export const SideByLogo = ({ size = 32, className }: SideByLogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="none"
    width={size}
    height={size}
    className={className}
    aria-label="SideBy logo"
  >
    {/* Fondo azul muy suave */}
    <rect width="32" height="32" rx="8" fill="#EBF3FF" />
    {/* Barras azules (mismo grosor que naranja, más separadas del eje) */}
    <line x1="12" y1="21" x2="12" y2="17" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="17" y1="21" x2="17" y2="12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="21" x2="22" y2="8" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    {/* Eje en L naranja con esquina curva (bezier) */}
    <path d="M7,7 L7,22 Q7,25 10,25 L26,25" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);
