import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentTable } from "@/components/IncidentTable";
import { useIncidents } from "@/hooks/useIncidents";
import { usePermissions } from "@/hooks/usePermissions";
import { Search, Cpu, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function History() {
  const navigate = useNavigate();
  const { hardwareIncidents, softwareIncidents } = useIncidents();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<"hardware" | "software">("hardware");

  // Set initial tab based on permissions
  useEffect(() => {
    if (!permissions.canAccessHardwareIncidents && permissions.canAccessSoftwareIncidents) {
      setActiveTab("software");
    } else if (permissions.canAccessHardwareIncidents && !permissions.canAccessSoftwareIncidents) {
      setActiveTab("hardware");
    }
  }, [permissions]);

  const [hardwareFilters, setHardwareFilters] = useState({
    search: "",
  });

  const [softwareFilters, setSoftwareFilters] = useState({
    search: "",
  });

  const filteredHardwareIncidents = useMemo(() => {
    return hardwareIncidents.filter((incident) => {
      const searchText = hardwareFilters.search.toLowerCase();
      const matchesSearch =
        (incident.description || '').toLowerCase().includes(searchText) ||
        (incident.nom_de_equipement || '').toLowerCase().includes(searchText) ||
        (incident.numero_de_serie || '').toLowerCase().includes(searchText) ||
        (incident.partition || '').toLowerCase().includes(searchText);

      return matchesSearch;
    });
  }, [hardwareIncidents, hardwareFilters.search]);

  const filteredSoftwareIncidents = useMemo(() => {
    return softwareIncidents.filter((incident) => {
      const searchText = softwareFilters.search.toLowerCase();
      const matchesSearch =
        (incident.description || '').toLowerCase().includes(searchText) ||
        (incident.sujet || '').toLowerCase().includes(searchText) ||
        (incident.server || '').toLowerCase().includes(searchText) ||
        (incident.type_d_anomalie || '').toLowerCase().includes(searchText);

      return matchesSearch;
    });
  }, [softwareIncidents, softwareFilters.search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historique</h1>
        <p className="text-muted-foreground">
          Consulter l'ensemble des incidents enregistrés
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "hardware" | "software")} className="w-full">
        <TabsList className={`grid w-full ${permissions.canAccessHardwareIncidents && permissions.canAccessSoftwareIncidents ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {permissions.canAccessHardwareIncidents && (
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Incidents Matériels ({hardwareIncidents.length})
            </TabsTrigger>
          )}
          {permissions.canAccessSoftwareIncidents && (
            <TabsTrigger value="software" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Incidents Logiciels ({softwareIncidents.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="hardware" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtres de recherche - Matériel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="hardware-search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hardware-search"
                      placeholder="Rechercher par description, équipement, numéro de série, partition..."
                      className="pl-9"
                      value={hardwareFilters.search}
                      onChange={(e) =>
                        setHardwareFilters({ ...hardwareFilters, search: e.target.value })
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
                Incidents Matériels ({filteredHardwareIncidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentTable
                incidents={filteredHardwareIncidents}
                onEdit={(id) => navigate(`/incident/edit/${id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="software" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtres de recherche - Logiciel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="software-search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="software-search"
                      placeholder="Rechercher par description, sujet, serveur, type d'anomalie..."
                      className="pl-9"
                      value={softwareFilters.search}
                      onChange={(e) =>
                        setSoftwareFilters({ ...softwareFilters, search: e.target.value })
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
                Incidents Logiciels ({filteredSoftwareIncidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentTable
                incidents={filteredSoftwareIncidents}
                onEdit={(id) => navigate(`/incident/edit/${id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
