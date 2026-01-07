import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncidents } from "@/hooks/useIncidents";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AddReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { softwareIncidents, addReport, getReports } = useIncidents();
  const [reports, setReports] = useState<any[]>([]);

  const incident = softwareIncidents.find((i) => i.id === Number(id));
  // Initialize form with incident description for anomaly
  const [formData, setFormData] = useState({
    anomaly: incident?.description || "",
    analysis: "",
    conclusion: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          // Report loading timeout - set loading to false
          setIsLoading(false);
        }, 10000); // 10 second timeout
        
        const incidentReports = await getReports(Number(id));
        clearTimeout(timeoutId);
        setReports(incidentReports);
        
        // If there's already a report, populate the form for editing
        if (incidentReports.length > 0) {
          const existingReport = incidentReports[0];
          setFormData({
            anomaly: existingReport.anomaly || incident?.description || "",
            analysis: existingReport.analysis || "",
            conclusion: existingReport.conclusion || "",
          });
          setIsEditing(true);
        } else {
          // Auto-fill from incident if no report exists
          // Always use incident description for anomaly
          setFormData({
            anomaly: incident?.description || "",
            analysis: "",
            conclusion: "",
          });
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Error loading reports:", error);
        // Set empty state on error
        setReports([]);
        setFormData({
          anomaly: "",
          analysis: "",
          conclusion: "",
        });
        setIsEditing(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, [id, getReports]);

  // Update anomaly field when incident is loaded or changes
  // Always pre-fill with incident description when creating a new report
  useEffect(() => {
    if (incident && incident.description) {
      // Always use incident description when creating a new report (not editing)
      if (!isEditing) {
        setFormData(prev => ({
          ...prev,
          anomaly: incident.description || "",
        }));
      }
    }
  }, [incident, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    setReportDialogOpen(true);
  };

  const handleReportConfirm = async () => {
    if (!incident) return;

    try {
      await addReport(Number(id), formData);
      if (isEditing) {
        toast.success("Rapport modifié avec succès");
      } else {
        toast.success("Rapport ajouté avec succès");
        setIsEditing(true);
      }
      
      // Refresh reports
      const incidentReports = await getReports(Number(id));
      setReports(incidentReports);
      setReportDialogOpen(false);
    } catch (error) {
      toast.error(isEditing ? "Erreur lors de la modification du rapport" : "Erreur lors de l'ajout du rapport");
      setReportDialogOpen(false);
    }
  };

  const handlePrintReport = () => {
    if (reports.length === 0) {
      toast.error("Aucun rapport à imprimer");
      return;
    }

    const report = reports[0];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    };

    const partition = incident.partition || 'Non spécifiée';
    const incidentDate = incident.date || report.date;

    const htmlContent = `
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
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (!incident) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/software")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Incident non trouvé
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (incident.incident_type !== 'software') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Les rapports ne peuvent être créés que pour les incidents logiciels.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Cet incident est de type {incident.incident_type}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/software")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux incidents
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Modifier le rapport" : "Ajouter un rapport"}
        </h1>
        <p className="text-muted-foreground">
          Incident #{incident.id}: {incident.description}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Un seul rapport peut être associé à cet incident logiciel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'incident</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="font-medium">{incident.date}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Heure (GMT)</Label>
              <p className="font-medium">{incident.time}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Description (utilisée pour l'anomalie du rapport)</Label>
              <p className="font-medium">{incident.description || "Aucune description"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Modifier le rapport" : "Nouveau rapport"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : (
            <form key={isEditing ? 'editing' : 'creating'} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anomaly">Anomalie observée (pré-remplie depuis la description de l'incident)</Label>
              <Textarea
                id="anomaly"
                placeholder="Décrivez l'anomalie observée..."
                value={formData.anomaly}
                onChange={(e) =>
                  setFormData({ ...formData, anomaly: e.target.value })
                }
                required
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Cette valeur est automatiquement pré-remplie depuis la description de l'incident. Date et heure sont également pré-remplies depuis l'incident.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysis">Analyse</Label>
              <Textarea
                id="analysis"
                placeholder="Analyse technique de l'incident..."
                value={formData.analysis}
                onChange={(e) =>
                  setFormData({ ...formData, analysis: e.target.value })
                }
                required
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conclusion">Conclusion</Label>
              <Textarea
                id="conclusion"
                placeholder="Conclusion et recommandations..."
                value={formData.conclusion}
                onChange={(e) =>
                  setFormData({ ...formData, conclusion: e.target.value })
                }
                required
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full">
              {isEditing ? "Modifier le rapport" : "Ajouter le rapport"}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rapport de l'incident</CardTitle>
            {reports.length > 0 && (
              <Button onClick={handlePrintReport} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer le rapport
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun rapport pour cet incident. Créez-en un ci-dessus.
              <br />
              <span className="text-xs mt-2 block">Note: Un seul rapport peut être créé par incident logiciel.</span>
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Note:</strong> Un seul rapport peut être créé par incident logiciel. 
                  Vous pouvez modifier le rapport existant ci-dessus.
                </p>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead className="w-32">Date</TableHead>
                      <TableHead className="w-24">Heure</TableHead>
                      <TableHead>Anomalie</TableHead>
                      <TableHead>Conclusion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>#{report.id}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.time}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {report.anomaly}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {report.conclusion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Confirmation Dialog */}
      <ConfirmationDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        title={isEditing ? "Modifier le rapport" : "Ajouter le rapport"}
        description={`Êtes-vous sûr de vouloir ${isEditing ? "modifier" : "ajouter"} le rapport pour l'incident #${incident?.id} ?`}
        confirmText={isEditing ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
        onConfirm={handleReportConfirm}
        variant="default"
      />
    </div>
  );
}
