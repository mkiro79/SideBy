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
      {/* Barra superior móvil - sticky, no tapa el contenido */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between px-4 bg-sidebar border-b border-sidebar-border md:hidden">
          {/* Marca */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="font-bold text-base">SideBy</span>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={openMobile ? 'Cerrar menú' : 'Abrir menú de navegación'}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
