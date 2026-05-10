// React Router imports
import { NavLink } from "react-router-dom";

// Third-party imports
import { Home, Cpu, HardDrive, FileText, History, Server, ClipboardList, ShieldAlert, Camera, MapPin, Activity, BrainCircuit } from "lucide-react";

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

  // Safety Intelligence Platform (Phase 3 - Primary)
  if (permissions.canAccessDashboards) {
    navigationItems.push({ name: "Executive Dashboard", href: "/ai/dashboard", icon: Home });
    navigationItems.push({ name: "AI Alert Center", href: "/ai/alerts", icon: ShieldAlert });
    navigationItems.push({ name: "Neural Inspection", href: "/ai/upload", icon: Camera });
    navigationItems.push({ name: "Zone Visualization", href: "/ai/zones", icon: MapPin });
    navigationItems.push({ name: "Compliance Trends", href: "/ai/analytics", icon: BrainCircuit });
    
    // Classic Operations & Predictive Analysis
    navigationItems.push({ name: "Operations Analytics", href: "/", icon: Activity });
    navigationItems.push({ name: "Equipment & Assets", href: "/equipment", icon: Server });
  }

  // Hardware/Software Incident Management
  if (!isChefDepartement) {
    if (permissions.canAccessHardwareIncidents) {
      navigationItems.push({ name: "Hardware Incidents", href: "/hardware", icon: Cpu });
    }
    if (permissions.canAccessSoftwareIncidents || permissions.canModifySoftwareIncidents) {
      navigationItems.push({ name: "Software Incidents", href: "/software", icon: HardDrive });
    }
  }

  // History & Reports
  if (isChefDepartement) {
    if (permissions.canAccessHardwareIncidents) {
      navigationItems.push({ name: "History Hardware", href: "/history/hardware", icon: History });
    }
    if (permissions.canAccessSoftwareIncidents) {
      navigationItems.push({ name: "History Software", href: "/history/software", icon: History });
    }
  } else {
    if (permissions.canAccessHardwareIncidents || permissions.canAccessSoftwareIncidents) {
      navigationItems.push({ name: "Unified History", href: "/history", icon: History });
    }
  }

  if (permissions.canAccessReports) {
    navigationItems.push({ name: "Technical Reports", href: "/reports", icon: ClipboardList });
  }

  if (isSuperadmin) {
    navigationItems.push({ name: "System Control", href: "/users", icon: FileText });
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center px-6 border-b border-sidebar-border">
          <span className="text-sidebar-foreground font-black text-xl tracking-tighter">Guardian Vision</span>
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
            Industrial Safety Intelligence Platform
          </p>
        </div>
      </div>
    </aside>
  );
}
