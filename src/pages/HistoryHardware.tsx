// React imports
import { useState, useMemo } from "react";

// React Router imports
import { useNavigate } from "react-router-dom";

// Third-party imports
import { Search, Cpu } from "lucide-react";

// Local hook imports
import { useIncidents } from "@/hooks/useIncidents";

// Local component imports
import { IncidentTable } from "@/components/IncidentTable";

// UI component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HistoryHardware() {
  const navigate = useNavigate();
  const { hardwareIncidents } = useIncidents();
  const [filters, setFilters] = useState({
    search: "",
  });

  const filteredIncidents = useMemo(() => {
    return hardwareIncidents.filter((incident) => {
      const searchText = filters.search.toLowerCase();
      const matchesSearch =
        (incident.description || '').toLowerCase().includes(searchText) ||
        (incident.nom_de_equipement || '').toLowerCase().includes(searchText) ||
        (incident.numero_de_serie || '').toLowerCase().includes(searchText) ||
        (incident.partition || '').toLowerCase().includes(searchText);

      return matchesSearch;
    });
  }, [hardwareIncidents, filters.search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historique Hardware</h1>
        <p className="text-muted-foreground">
          Consulter l'historique des incidents matériels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par description, équipement, numéro de série, partition..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Incidents Matériels ({filteredIncidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentTable
            incidents={filteredIncidents}
            onEdit={(id) => navigate(`/incident/edit/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
