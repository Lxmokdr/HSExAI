// React Router imports
import { NavLink } from "react-router-dom";

// Third-party imports
import { Home, Cpu, HardDrive, FileText, History, Server, ClipboardList } from "lucide-react";

// Local hook imports
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

// Local utility imports
import { cn } from "@/lib/utils";

export function Sidebar() {
  const permissions = usePermissions();
  const { user } = useAuth();
  const isChefDepartement = user?.role === 'chef_departement';
  const isSuperadmin = user?.role === 'superadmin';

  // Build navigation items based on role
  const navigationItems = [];

  // Dashboard - only for chef_departement and superadmin
  if (permissions.canAccessDashboards) {
    navigationItems.push({ name: "Tableau de bord", href: "/", icon: Home });
  }

  // For chef_departement: only show history tabs, no incidents tabs
  if (isChefDepartement) {
    // Chef de département sees separate history tabs
    if (permissions.canAccessHardwareIncidents) {
      navigationItems.push({ name: "Historique Hardware", href: "/history/hardware", icon: Cpu });
    }
    if (permissions.canAccessSoftwareIncidents) {
      navigationItems.push({ name: "Historique Software", href: "/history/software", icon: HardDrive });
    }
  } else {
    // For other roles: show incidents tabs and single history
    if (permissions.canAccessHardwareIncidents) {
      navigationItems.push({ name: "Incidents Hardware", href: "/hardware", icon: Cpu });
    }
    // Show Software Incidents if user can access OR modify (for service_maintenance)
    if (permissions.canAccessSoftwareIncidents || permissions.canModifySoftwareIncidents) {
      navigationItems.push({ name: "Incidents Software", href: "/software", icon: HardDrive });
    }
    if (permissions.canAccessEquipment) {
      navigationItems.push({ name: "Équipements", href: "/equipment", icon: Server });
    }
    // Single history tab for other roles (only if they have access)
    if (permissions.canAccessHardwareIncidents || permissions.canAccessSoftwareIncidents) {
      navigationItems.push({ name: "Historique", href: "/history", icon: History });
    }
  }

  // Reports - for users who can access reports
  if (permissions.canAccessReports) {
    navigationItems.push({ name: "Rapports", href: "/reports", icon: ClipboardList });
  }

  // User management - only for superadmin
  if (isSuperadmin) {
    navigationItems.push({ name: "Gestion Utilisateurs", href: "/users", icon: FileText });
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-25 items-center justify-center border-b border-sidebar-border bg-sidebar-accent">
          <div className="flex items-center gap-2 p-2">
            <div className="h-16 w-16 rounded-lg flex items-center justify-center bg-white">
              <img src="/enna.png" alt="ENNA Logo" className="h-16 w-16 object-contain" />
            </div>
            <span className="text-sidebar-foreground font-bold text-xl">ENNA ATC</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60 text-center">
            Système de Gestion des Incidents
          </p>
        </div>
      </div>
    </aside>
  );
}
