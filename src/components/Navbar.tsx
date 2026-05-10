// Third-party imports
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";

// Local hook imports
import { useAuth } from "@/hooks/useAuth";

// UI component imports
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-border bg-card">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
            Safety Intelligence Suite
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {user ? user.username : "Agent"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
