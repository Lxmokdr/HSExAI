import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, FileText, Printer } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useState } from "react";
import { Report } from "@/services/api";

export interface Incident {
  id: number;
  incident_type: 'hardware' | 'software';
  date: string;
  time: string;
  description: string;
  // Hardware fields
  nom_de_equipement?: string;
  partition?: string;
  numero_de_serie?: string;
  equipement_id?: number;
  equipment?: {
    id: number;
    nom_equipement: string;
    partition: string;
    num_serie: string;
  } | null;
  anomalie_observee?: string;
  action_realisee?: string;
  piece_de_rechange_utilisee?: string;
  etat_de_equipement_apres_intervention?: string;
  recommendation?: string;
  maintenance_type?: 'preventive' | 'corrective';
  // Software fields
  position?: string;
  type_d_anomalie?: string;
  call_sign?: string;
  nom_radar?: string;
  FL?: string;
  longitude?: string;
  latitude?: string;
  code_SSR?: string;
  sujet?: string;
  commentaires?: string;
}

interface IncidentTableProps {
  incidents: Incident[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAddReport?: (id: number) => void;
  showReportButton?: boolean;
  reports?: any[];
}

export function IncidentTable({ 
  incidents, 
  onEdit, 
  onDelete, 
  onAddReport,
  showReportButton = false,
  reports = []
}: IncidentTableProps) {
  const permissions = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  const canModifyIncident = (incident: Incident) => {
    if (incident.incident_type === 'hardware') {
      return permissions.canModifyHardwareIncidents;
    } else {
      return permissions.canModifySoftwareIncidents;
    }
  };

  const handleDeleteClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedIncident) {
      onDelete?.(selectedIncident.id);
    }
  };

  const handleEditConfirm = () => {
    if (selectedIncident) {
      onEdit?.(selectedIncident.id);
    }
  };
  
  const handlePrintReport = async (incident: Incident) => {
    if (incident.incident_type !== 'software') return;
    
    try {
      const { apiClient } = await import('@/services/api');
      const reportsResponse = await apiClient.getReports({ incident: incident.id });
      if (!reportsResponse.results || reportsResponse.results.length === 0) {
        alert('Aucun rapport disponible pour cet incident');
        return;
      }
      
      const report = reportsResponse.results[0];
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
            
            <script>
              window.onload = () => window.print();
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('Error printing report:', err);
      alert('Erreur lors de l\'impression du rapport');
    }
  };
  
  const handlePrint = async (incident: Incident) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Determine incident type for title and fields
    const isHardware = incident.incident_type === 'hardware';
    const incidentTitle = isHardware ? 'Fiche intervention technique' : 'Formulaire de description d\'anomalie';
    const headerCode = isHardware ? 'DE/DS/SMS' : 'DE/DS/SID';
    
    // Try to fetch report for software incidents
    let report: Report | null = null;
    if (!isHardware && onAddReport) {
      try {
        const { apiClient } = await import('@/services/api');
        const reportsResponse = await apiClient.getReports({ incident: incident.id });
        if (reportsResponse.results && reportsResponse.results.length > 0) {
          report = reportsResponse.results[0];
        }
      } catch (err) {
        console.error('Error loading report:', err);
      }
    }
    
    // Helper to escape HTML
    const escapeHtml = (text: string | undefined | null) => {
      if (!text) return 'N/A';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // Helper to format field groups
    const renderFieldGroup = (label: string, fields: Array<{label: string, value: any}>, fieldsPerRow: number = 1) => {
      const totalCols = fieldsPerRow * 2; // Each field has label + value = 2 columns
      const headerRow = label ? `
        <tr>
          <th colspan="${totalCols}" style="text-align: left; background-color: #f0f0f0; color: #333;">${label}</th>
        </tr>
      ` : '';
      
      if (fieldsPerRow === 1) {
        // Single column layout (default) - field takes full width
        return headerRow + fields.map(field => `
          <tr class="single-field-row" style="height: auto !important; min-height: 0 !important; max-height: none !important;">
            <td class="label single-field-label" style="width: 35% !important; min-width: 35% !important; max-width: 35% !important; height: auto !important; min-height: 0 !important; max-height: none !important; vertical-align: top !important; padding: 8px 12px !important; line-height: 1.3 !important; overflow: visible !important;">${field.label}</td>
            <td class="value single-field-value" style="width: 65% !important; min-width: 65% !important; max-width: 65% !important; height: auto !important; min-height: 0 !important; max-height: none !important; vertical-align: top !important; padding: 8px 12px !important; line-height: 1.3 !important; overflow: visible !important; word-break: break-word;">${escapeHtml(field.value)}</td>
          </tr>
        `).join('');
      } else {
        // Multi-column layout (fields in same row) - each field pair takes equal width
        // For 2 fields per row: each field gets 50% (label ~20% + value ~30% of total width)
        const fieldWidthPercent = 100 / fieldsPerRow; // 50% for 2 fields
        const labelWidthPercent = fieldWidthPercent * 0.4; // 40% of field width for label (20% of total)
        const valueWidthPercent = fieldWidthPercent * 0.6; // 60% of field width for value (30% of total)
        
        const rows: string[] = [];
        for (let i = 0; i < fields.length; i += fieldsPerRow) {
          const rowFields = fields.slice(i, i + fieldsPerRow);
          // Fill remaining columns if needed
          const remainingFields = fieldsPerRow - rowFields.length;
          rows.push(`
            <tr class="two-field-row" style="height: auto !important; min-height: 0 !important; max-height: none !important;">
              ${rowFields.map(field => `
                <td class="label two-field-label" style="width: ${labelWidthPercent}% !important; min-width: ${labelWidthPercent}% !important; max-width: ${labelWidthPercent}% !important; height: auto !important; min-height: 0 !important; max-height: none !important; vertical-align: top !important; padding: 8px 12px !important; line-height: 1.3 !important; overflow: visible !important;">${field.label}</td>
                <td class="value two-field-value" style="width: ${valueWidthPercent}% !important; min-width: ${valueWidthPercent}% !important; max-width: ${valueWidthPercent}% !important; height: auto !important; min-height: 0 !important; max-height: none !important; vertical-align: top !important; padding: 8px 12px !important; line-height: 1.3 !important; overflow: visible !important; word-break: break-word;">${escapeHtml(field.value)}</td>
        `).join('')}
              ${remainingFields > 0 ? Array(remainingFields * 2).fill('<td style="width: 0; height: 0; padding: 0; border: none; display: none;"></td>').join('') : ''}
            </tr>
          `);
        }
        return headerRow + rows.join('');
      }
    };
    
    // Create HTML content matching form layout
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${incidentTitle} #${incident.id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              max-width: 100%; 
              width: 100%;
              margin: 0;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #007bff;
              padding-bottom: 20px;
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
            .header h1 {
              color: #007bff;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 5px 0;
            }
            .actions {
              margin-bottom: 20px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
              display: flex;
              gap: 10px;
              align-items: center;
            }
            .actions button {
              padding: 10px 20px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            }
            .actions button:hover {
              background: #0056b3;
            }
            .actions button.secondary {
              background: #6c757d;
            }
            .actions button.secondary:hover {
              background: #545b62;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              table-layout: fixed;
              border-spacing: 0;
              height: auto !important;
            }
            th {
              background-color: #007bff;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #0056b3;
            }
            td {
              padding: 8px 12px;
              border: 1px solid #ddd;
              vertical-align: top;
              word-wrap: break-word;
              overflow-wrap: break-word;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              line-height: 1.3;
              overflow: visible;
            }
            tr {
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .label {
              font-weight: bold;
              color: #333;
              background-color: #f8f9fa;
            }
            .value {
              color: #555;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            /* Single field rows - full width */
            .single-field-row {
              height: auto !important;
              min-height: 0 !important;
            }
            .single-field-row .single-field-label {
              width: 35% !important;
              min-width: 35% !important;
              max-width: 35% !important;
              height: auto !important;
              min-height: 0 !important;
            }
            .single-field-row .single-field-value {
              width: 65% !important;
              min-width: 65% !important;
              max-width: 65% !important;
              height: auto !important;
              min-height: 0 !important;
            }
            /* Two field rows - half width each */
            .two-field-row {
              height: auto !important;
              min-height: 0 !important;
            }
            .two-field-row .two-field-label {
              width: 20% !important;
              min-width: 20% !important;
              max-width: 20% !important;
              height: auto !important;
              min-height: 0 !important;
            }
            .two-field-row .two-field-value {
              width: 30% !important;
              min-width: 30% !important;
              max-width: 30% !important;
              height: auto !important;
              min-height: 0 !important;
            }
            .description-field {
              white-space: pre-wrap;
              line-height: 1.6;
            }
            .report-section {
              margin-top: 30px;
              page-break-before: auto;
            }
            .report-section h2 {
              color: #007bff;
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            @media print {
                @page {
                  margin: 0;
                  size: A4;
                  /* Remove browser default headers/footers */
                  marks: none;
                }
                body {
                  padding: 1cm !important; 
                  margin: 0 !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
              .actions { display: none !important; }
                .header {
                  page-break-after: avoid; 
                  margin-bottom: 20px;
                }
                table { 
                  page-break-inside: avoid;
                  width: 100% !important;
                  max-width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: fixed !important;
                  border-spacing: 0 !important;
                  margin: 0 !important;
                  height: auto !important;
                }
                td, th {
                  padding: 8px !important;
                  border: 1px solid #000 !important;
                  page-break-inside: avoid;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  vertical-align: top !important;
                  overflow: visible !important;
                  line-height: 1.4 !important;
                  white-space: normal !important;
                }
                tr {
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                }
                /* Remove any rowspan or colspan issues */
                td[rowspan], th[rowspan] {
                  height: auto !important;
                  min-height: 0 !important;
                }
                /* Ensure cells only take space they need - especially for two-field rows */
                .single-field-row td,
                .two-field-row td {
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  padding: 6px 8px !important;
                  line-height: 1.3 !important;
                }
                /* Specific fix for equipment fields that might have long text */
                .two-field-row .value {
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  hyphens: auto !important;
                }
              /* Single field rows - preserve full width (35% label + 65% value) */
              .single-field-row .single-field-label {
                width: 35% !important;
                min-width: 35% !important;
                max-width: 35% !important;
              }
              .single-field-row .single-field-value {
                width: 65% !important;
                min-width: 65% !important;
                max-width: 65% !important;
              }
              /* Two field rows - preserve half width (20% label + 30% value each) */
              .two-field-row .two-field-label {
                width: 20% !important;
                min-width: 20% !important;
                max-width: 20% !important;
              }
              .two-field-row .two-field-value {
                width: 30% !important;
                min-width: 30% !important;
                max-width: 30% !important;
              }
              .label {
                background-color: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-code">${headerCode}</div>
            <h1>${incidentTitle}</h1>
            <p>Établissement National de la Navigation Aérienne (ENNA)</p>
          </div>
          
          <div class="actions">
            <button onclick="window.print()">Imprimer l'incident</button>
            ${!isHardware ? `
              ${report ? `
                <button class="secondary" onclick="printReport()">Imprimer le rapport</button>
                <button class="secondary" onclick="window.open('/software/report', '_blank')">Modifier le rapport</button>
              ` : `
                <button class="secondary" onclick="window.open('/software/report', '_blank')">Ajouter un rapport</button>
              `}
            ` : ''}
          </div>
          
          <table>

            ${renderFieldGroup('', [
              { label: 'ID de l\'Incident', value: incident.id },
            ])}
            ${renderFieldGroup('', [
              { label: 'Date', value: incident.date },
            ])}
            ${renderFieldGroup('', [
              { label: 'Heure (GMT)', value: incident.time }
            ])}
            ${isHardware ? `
              ${renderFieldGroup('ÉQUIPEMENT', [
                { label: 'Nom de l\'équipement', value: incident.nom_de_equipement },
              ])}
              ${renderFieldGroup('', [
                { label: 'Partition', value: incident.partition },
              ])}
              ${renderFieldGroup('', [
                { label: 'Numéro de série', value: incident.numero_de_serie },
              ])}
              ${renderFieldGroup('', [
                { label: 'Type de maintenance', value: incident.maintenance_type === 'preventive' ? 'Préventive' : incident.maintenance_type === 'corrective' ? 'Corrective' : 'Non spécifié' }
              ])}
              ${renderFieldGroup('DESCRIPTION', [
                { label: 'Description', value: incident.description },
              ])}
              ${renderFieldGroup('', [
                { label: 'Anomalie observée', value: incident.anomalie_observee }
              ])}
              ${renderFieldGroup('INTERVENTION', [
                { label: 'Action réalisée', value: incident.action_realisee },
                { label: 'Pièce de rechange utilisée', value: incident.piece_de_rechange_utilisee },
                { label: 'État de l\'équipement après intervention', value: incident.etat_de_equipement_apres_intervention },
                { label: 'Recommandation', value: incident.recommendation }
              ])}
            ` : `
              ${renderFieldGroup('', [
                { label: 'Partition', value: incident.partition },
              ])}
              ${renderFieldGroup('', [
                { label: 'Position', value: incident.position }
              ])}
              ${renderFieldGroup('ANOMALIE', [
                { label: 'Type d\'anomalie', value: incident.type_d_anomalie },
                { label: 'Call Sign', value: incident.call_sign },
                { label: 'Nom radar', value: incident.nom_radar },
                { label: 'FL (ou altitude)', value: incident.FL }
              ])}
              ${renderFieldGroup('COORDONNÉES', [
                { label: 'Longitude', value: incident.longitude },
              ])}
              ${renderFieldGroup('', [
                { label: 'Latitude', value: incident.latitude },
              ])}
              ${renderFieldGroup('', [
                { label: 'Code SSR', value: incident.code_SSR }
              ])}
              ${renderFieldGroup('DESCRIPTION', [
                { label: 'Sujet', value: incident.sujet },
              ])}
              ${renderFieldGroup('', [
                { label: 'Description', value: incident.description },
              ])}
              ${renderFieldGroup('', [
                { label: 'Commentaires', value: incident.commentaires }
              ])}
            `}
          </table>
          
          ${!isHardware && report ? `
            <div class="report-section">
              <h2>RAPPORT D'INCIDENT</h2>
              <table id="report-table">
                <tr>
                  <th colspan="2" style="text-align: center;">DÉTAILS DU RAPPORT</th>
                </tr>
                ${renderFieldGroup('', [
                  { label: 'Date', value: incident.date },
                ])}
                ${renderFieldGroup('', [
                  { label: 'Heure (GMT)', value: incident.time },
                ])}
                ${renderFieldGroup('', [
                  { label: 'Anomalie', value: report.anomaly }
                ])}
                <tr>
                  <td class="label">Analyse</td>
                  <td class="value description-field">${escapeHtml(report.analysis)}</td>
                </tr>
                <tr>
                  <td class="label">Conclusion</td>
                  <td class="value description-field">${escapeHtml(report.conclusion)}</td>
                </tr>
              </table>
            </div>
          ` : ''}
          
          <script>
            function printReport() {
              const reportTable = document.getElementById('report-table');
              if (!reportTable) return;
              
              const printContent = document.head.outerHTML + 
                '<body>' + 
                '<div class="header"><div class="header-code">DE/DS/SID</div><h1>Fiche incident software</h1></div>' +
                reportTable.outerHTML +
                '</body>';
              
              const reportWindow = window.open('', '_blank');
              if (reportWindow) {
                reportWindow.document.write(printContent);
                reportWindow.document.close();
                reportWindow.onload = () => reportWindow.print();
              }
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead className="w-32">Date</TableHead>
            <TableHead className="w-24">Heure</TableHead>
            <TableHead>Description</TableHead>
            {incidents.some(incident => incident.incident_type === 'hardware') && (
              <TableHead className="w-40">Équipement</TableHead>
            )}
            {incidents.some(incident => incident.incident_type === 'software') && (
              <TableHead className="w-40">Sujet</TableHead>
            )}
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Aucun incident enregistré
              </TableCell>
            </TableRow>
          ) : (
            incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">#{incident.id}</TableCell>
                <TableCell>{incident.date}</TableCell>
                <TableCell>{incident.time}</TableCell>
                <TableCell className="max-w-md truncate">{incident.description}</TableCell>
                {incidents.some(i => i.incident_type === 'hardware') && (
                  <TableCell className="max-w-md truncate">
                    {incident.incident_type === 'hardware' ? (
                      incident.equipment ? (
                        <div>
                          <div className="font-medium">{incident.equipment.nom_equipement || "-"}</div>
                          <div className="text-xs text-muted-foreground">{incident.equipment.partition || "-"}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )
                    ) : "-"}
                  </TableCell>
                )}
                {incidents.some(i => i.incident_type === 'software') && (
                  <TableCell className="max-w-md truncate">
                    {incident.incident_type === 'software' ? (incident.sujet || "-") : "-"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {showReportButton && incident.incident_type === 'software' && permissions.canModifyReports && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddReport?.(incident.id)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {reports.some(r => r.incident === incident.id) ? "Modifier Rapport" : "Ajouter Rapport"}
                        </span>
                      </Button>
                    )}
                    {incident.incident_type === 'software' && (
                      <>
                        {onAddReport && showReportButton && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddReport(incident.id)}
                            className="flex items-center gap-2"
                            title={reports.some(r => r.incident === incident.id) ? "Modifier le rapport" : "Ajouter un rapport"}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {reports.some(r => r.incident === incident.id) ? "Modifier Rapport" : "Ajouter Rapport"}
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReport(incident)}
                          className="flex items-center gap-2"
                          title={reports.some(r => r.incident === incident.id) ? "Imprimer le rapport" : "Vérifier et imprimer le rapport"}
                        >
                          <Printer className="h-4 w-4" />
                          <span className="hidden sm:inline">Imprimer Rapport</span>
                        </Button>
                      </>
                    )}
                    {canModifyIncident(incident) && onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(incident)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Modifier</span>
                    </Button>
                    )}
                    {!showReportButton && canModifyIncident(incident) && onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(incident)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </Button>
                      
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(incident)}
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Imprimer</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer l'incident"
        description={`Êtes-vous sûr de vouloir supprimer l'incident #${selectedIncident?.id} ? Cette action est irréversible et supprimera également tous les rapports associés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
      
      <ConfirmationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Modifier l'incident"
        description={`Êtes-vous sûr de vouloir modifier l'incident #${selectedIncident?.id} ? Vous serez redirigé vers la page de modification.`}
        confirmText="Modifier"
        cancelText="Annuler"
        onConfirm={handleEditConfirm}
        variant="default"
      />
    </div>
  );
}
