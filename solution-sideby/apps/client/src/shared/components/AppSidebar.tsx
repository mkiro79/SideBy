/**
 * AppSidebar - Barra lateral de navegación principal
 * Componente que proporciona la navegación principal de la aplicación SideBy.
 * Responsive: se colapsa como drawer (offcanvas) en resoluciones móviles.
 */
import { Home, BarChart3, FileSpreadsheet, Settings, LogOut, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { useAuthStore } from "@/features/auth/store/auth.store.js";

const menuItems = [
  { icon: Home, label: "Inicio", path: "/home" },
  // { icon: BarChart3, label: "Dashboards", path: "/dashboards" }, //TODO: Agregar sección de dashboards en el futuro  
  { icon: FileSpreadsheet, label: "Datasets", path: "/datasets" },
  { icon: Settings, label: "Configuración", path: "/settings" }, //TODO: Agregar sección de configuración en el futuro
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { toggleSidebar, openMobile, isMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Botón hamburguesa - solo visible en móvil cuando el sidebar está cerrado */}
      {isMobile && !openMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Abrir menú de navegación"
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-md md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Botón de cierre - visible en móvil cuando el sidebar está abierto */}
      {isMobile && openMobile && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Cerrar menú de navegación"
          className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-md md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">SideBy</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.path}
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}
