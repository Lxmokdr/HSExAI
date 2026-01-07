// React imports
import { useState, useEffect, useMemo } from "react";

// React Router imports
import { useNavigate } from "react-router-dom";

// Third-party imports
import { Search, FileText, Eye, Edit, Printer, Plus } from "lucide-react";
import { toast } from "sonner";

// Local hook imports
import { usePermissions } from "@/hooks/usePermissions";
import { useIncidents } from "@/hooks/useIncidents";
import { apiClient, Report } from "@/services/api";

// UI component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Reports() {
  const permissions = usePermissions();
  const navigate = useNavigate();
  const { softwareIncidents } = useIncidents();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [incidentSearchQuery, setIncidentSearchQuery] = useState<string>("");
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getReports();
      setReports(response.results || []);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      toast.error("Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const searchText = filters.search.toLowerCase();
      const matchesSearch =
        (report.anomaly || '').toLowerCase().includes(searchText) ||
        (report.analysis || '').toLowerCase().includes(searchText) ||
        (report.conclusion || '').toLowerCase().includes(searchText) ||
        report.incident.toString().includes(searchText);

      return matchesSearch;
    });
  }, [reports, filters.search]);

  const handleViewReport = (report: Report) => {
    navigate(`/software/report/${report.incident}`);
  };

  const handleCreateReport = () => {
    if (selectedIncidentId) {
      navigate(`/software/report/${selectedIncidentId}`);
      setCreateReportDialogOpen(false);
      setSelectedIncidentId(null);
    } else {
      toast.error("Veuillez sélectionner un incident");
    }
  };

  // Get software incidents that don't have a report yet
  const incidentsWithoutReport = useMemo(() => {
    const reportedIncidentIds = new Set(reports.map(r => r.incident));
    return softwareIncidents.filter(incident => !reportedIncidentIds.has(incident.id));
  }, [softwareIncidents, reports]);

  // Filter incidents by search query (ID, description, server)
  const filteredIncidentsForSelection = useMemo(() => {
    if (!incidentSearchQuery.trim()) {
      return incidentsWithoutReport.slice(0, 10); // Show first 10 when no search
    }
    const query = incidentSearchQuery.toLowerCase();
    return incidentsWithoutReport.filter(incident => 
      incident.id.toString().includes(query) ||
      (incident.description || '').toLowerCase().includes(query) ||
      (incident.sujet || '').toLowerCase().includes(query) ||
      (incident.server || '').toLowerCase().includes(query)
    ).slice(0, 10);
  }, [incidentsWithoutReport, incidentSearchQuery]);

  // Get selected incident display text
  const selectedIncidentDisplay = useMemo(() => {
    if (!selectedIncidentId) return "";
    const incident = incidentsWithoutReport.find(i => i.id === selectedIncidentId);
    if (!incident) return "";
    return `#${incident.id} - ${incident.sujet || incident.description?.substring(0, 50) || "Sans titre"} (${incident.date})`;
  }, [selectedIncidentId, incidentsWithoutReport]);

  const handlePrintReport = async (report: Report) => {
    try {
      // Fetch the associated incident
      const incidentResponse = await apiClient.getIncidents();
      const incident = incidentResponse.results.find((i: any) => i.id === report.incident);
      
      if (!incident) {
        toast.error("Incident associé introuvable");
        return;
      }

      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const escapeHtml = (text: string | undefined | null) => {
        if (!text) return 'N/A';
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      const partition = incident.partition || 'Non spécifiée';
      const incidentDate = incident.date || report.date;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Fiche incident software - Rapport</title>
          <style>
            @media print {
              @page {
                size: A4 landscape;
                margin: 0;
                /* Remove browser default headers/footers */
                marks: none;
              }
              body {
                padding: 2cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              position: relative;
            }
            .header-code {
              position: absolute;
              top: 0;
              left: 0;
              font-weight: bold;
              font-size: 14px;
              color: #333;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .entete {
              text-align: justify;
              font-size: 14px;
              margin-bottom: 25px;
              line-height: 1.8;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .report-table th {
              background-color: #333;
              color: white;
              padding: 12px;
              text-align: center;
              font-weight: bold;
              font-size: 13px;
              border: 1px solid #000;
            }
            .report-table td {
              padding: 10px;
              border: 1px solid #000;
              vertical-align: top;
              font-size: 12px;
            }
            .report-table td.anomalie {
              width: 30%;
            }
            .report-table td.date {
              width: 15%;
              text-align: center;
            }
            .report-table td.analyse {
              width: 27.5%;
            }
            .report-table td.conclusion {
              width: 27.5%;
            }
            .report-table td.content {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-code">DE/DS/SID</div>
            <div class="title">
              Fiche incident software
            </div>
          </div>

          <div class="entete">
            J'ai l'honneur de vous faire parvenir ci-dessous les résultats des investigations relatives au formulaire de description des anomalies survenues le ${incidentDate}.
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th>Anomalie</th>
                <th>Date</th>
                <th>Analyse</th>
                <th>Conclusion</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="anomalie content">${escapeHtml(report.anomaly)}</td>
                <td class="date">${escapeHtml(incident.date)}</td>
                <td class="analyse content">${escapeHtml(report.analysis)}</td>
                <td class="conclusion content">${escapeHtml(report.conclusion)}</td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `);

      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error: any) {
      console.error("Error printing report:", error);
      toast.error("Erreur lors de l'impression du rapport");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rapports d'Analyse</h1>
        <p className="text-muted-foreground">
          Consulter et gérer tous les rapports d'analyse des incidents logiciels
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
                  placeholder="Rechercher par anomalie, analyse, conclusion, ID incident..."
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
          <div className="flex items-center justify-between">
            <CardTitle>
              Rapports ({filteredReports.length})
            </CardTitle>
            {permissions.canModifyReports && (
              <Button
                onClick={() => setCreateReportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer un rapport
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des rapports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rapport trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Rapport</TableHead>
                  <TableHead>ID Incident</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Anomalie</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">#{report.id}</TableCell>
                    <TableCell>#{report.incident}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.time}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {report.anomaly || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="flex items-center gap-2"
                          title="Voir/Modifier le rapport"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Voir</span>
                        </Button>
                        {permissions.canModifyReports && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            className="flex items-center gap-2"
                            title="Modifier le rapport"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Modifier</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReport(report)}
                          className="flex items-center gap-2"
                          title="Imprimer le rapport"
                        >
                          <Printer className="h-4 w-4" />
                          <span className="hidden sm:inline">Imprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <Dialog open={createReportDialogOpen} onOpenChange={setCreateReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau rapport</DialogTitle>
            <DialogDescription>
              Sélectionnez un incident logiciel pour créer son rapport d'analyse
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="incident-search">Incident logiciel</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="incident-search"
                    placeholder="Rechercher par ID, description, sujet ou serveur..."
                    className="pl-9"
                    value={selectedIncidentId ? selectedIncidentDisplay : incidentSearchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setIncidentSearchQuery(value);
                      setShowIncidentDropdown(true);
                      // Clear selection if user starts typing
                      if (selectedIncidentId && value !== selectedIncidentDisplay) {
                        setSelectedIncidentId(null);
                      }
                    }}
                    onFocus={() => setShowIncidentDropdown(true)}
                    onBlur={() => {
                      // Delay to allow click on dropdown item
                      setTimeout(() => setShowIncidentDropdown(false), 200);
                    }}
                  />
                </div>
                {showIncidentDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {incidentsWithoutReport.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Aucun incident disponible (tous ont déjà un rapport)
                      </div>
                    ) : filteredIncidentsForSelection.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Aucun incident trouvé
                      </div>
                    ) : (
                      filteredIncidentsForSelection.map((incident) => (
                        <div
                          key={incident.id}
                          className="p-3 cursor-pointer hover:bg-accent border-b border-border last:border-b-0"
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setIncidentSearchQuery("");
                            setShowIncidentDropdown(false);
                          }}
                        >
                          <div className="font-medium">#{incident.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {incident.sujet || incident.description?.substring(0, 60) || "Sans titre"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {incident.server && `Serveur: ${incident.server} • `}
                            Date: {incident.date}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {incidentsWithoutReport.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tous les incidents logiciels ont déjà un rapport associé.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateReportDialogOpen(false);
                  setSelectedIncidentId(null);
                  setIncidentSearchQuery("");
                  setShowIncidentDropdown(false);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateReport}
                disabled={!selectedIncidentId}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Créer le rapport
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
