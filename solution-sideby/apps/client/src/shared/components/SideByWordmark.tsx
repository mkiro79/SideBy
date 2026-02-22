import { cn } from "@/shared/utils/cn.js";

interface SideByWordmarkProps {
  className?: string;
}

/**
 * SideByWordmark - Marca de texto estilizada de SideBy
 *
 * Renderiza el nombre SideBy utilizando los colores corporativos
 * (azul para Side y naranja para By).
 * Acepta una clase opcional para personalizar tipografía y tamaño.
 */
export const SideByWordmark = ({ className }: SideByWordmarkProps) => {
  return (
    <span className={cn("inline-flex whitespace-nowrap", className)} aria-label="SideBy">
      <span className="text-[#3b82f6]">Side</span>
      <span className="text-[#f97316]">By</span>
    </span>
  );
};
