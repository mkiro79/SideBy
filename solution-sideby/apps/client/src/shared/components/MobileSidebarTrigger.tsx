/**
 * MobileSidebarTrigger - Botón hamburguesa para abrir el sidebar en móvil.
 *
 * Debe renderizarse DENTRO del árbol de SidebarProvider.
 * Usa useSidebar() para acceder a toggleSidebar.
 */

import { Menu } from "lucide-react";
import { useSidebar } from "@/shared/components/ui/sidebar.js";

export const MobileSidebarTrigger = () => {
  const { toggleSidebar, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="flex items-center gap-2 text-foreground"
      aria-label="Abrir menú"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};
