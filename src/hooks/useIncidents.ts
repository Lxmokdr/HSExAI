import { useState, useEffect, useCallback } from "react";
import { apiClient, Incident, Report, IncidentStats } from "@/services/api";
import { IncidentFormData } from "@/components/IncidentForm";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

export function useIncidents() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const permissions = usePermissions();
  const [hardwareIncidents, setHardwareIncidents] = useState<Incident[]>([]);
  const [softwareIncidents, setSoftwareIncidents] = useState<Incident[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load incidents on mount (only if authenticated)
  useEffect(() => {
    // Wait for auth to finish loading, then check if authenticated
    if (!authLoading && isAuthenticated) {
      loadIncidents();
      loadStats();
    } else if (!authLoading && !isAuthenticated) {
      // Not authenticated, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only load incidents that the user has permission to access
      const loadPromises: Promise<any>[] = [];

      if (permissions.canAccessHardwareIncidents) {
        loadPromises.push(
        apiClient.getIncidents({ type: 'hardware' }).catch(err => {
            // If 403, user doesn't have access - return empty
            if (err.status === 403) {
              return { results: [], count: 0 };
            }
          console.error("Error loading hardware incidents:", err);
          return { results: [], count: 0 };
          })
        );
      } else {
        // User doesn't have access, set empty array
        setHardwareIncidents([]);
      }

      if (permissions.canAccessSoftwareIncidents) {
        loadPromises.push(
        apiClient.getIncidents({ type: 'software' }).catch(err => {
            // If 403, user doesn't have access - return empty
            if (err.status === 403) {
              return { results: [], count: 0 };
            }
          console.error("Error loading software incidents:", err);
          return { results: [], count: 0 };
        })
        );
      } else {
        // User doesn't have access, set empty array
        setSoftwareIncidents([]);
      }

      // Only await if there are promises to wait for
      if (loadPromises.length > 0) {
        const responses = await Promise.all(loadPromises);
        
        // Set results based on what was loaded
        let responseIndex = 0;
        if (permissions.canAccessHardwareIncidents) {
          setHardwareIncidents(responses[responseIndex]?.results || []);
          responseIndex++;
        }
        if (permissions.canAccessSoftwareIncidents) {
          setSoftwareIncidents(responses[responseIndex]?.results || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des incidents");
      console.error("Error loading incidents:", err);
      // Set empty arrays on error to prevent crashes
      setHardwareIncidents([]);
      setSoftwareIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await apiClient.getIncidentStats();
      setStats(statsData);
    } catch (err: any) {
      console.error("Error loading stats:", err);
      // Set default stats on error
      setStats({
        total_incidents: 0,
        hardware_incidents: 0,
        software_incidents: 0
      });
    }
  };

  const addHardwareIncident = async (data: IncidentFormData) => {
    try {
      // Time should already be set from form, but ensure it's in HH:MM format
      let incidentTime = data.time;
      if (!incidentTime || incidentTime.trim() === '') {
        // Fallback to current UTC time if somehow empty
        const now = new Date();
        const utcHours = String(now.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
        incidentTime = `${utcHours}:${utcMinutes}`;
      }
      // Ensure time is in HH:MM format (remove seconds if present)
      if (incidentTime.includes(':')) {
        const parts = incidentTime.split(':');
        incidentTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      
      const incidentData = {
        incident_type: 'hardware' as const,
        date: data.date,
        time: incidentTime,
        nom_de_equipement: data.nom_de_equipement,
        partition: data.partition,
        numero_de_serie: data.numero_de_serie,
        description: data.description,
        anomalie_observee: data.anomalie_observee,
        action_realisee: data.action_realisee,
        piece_de_rechange_utilisee: data.piece_de_rechange_utilisee,
        etat_de_equipement_apres_intervention: data.etat_de_equipement_apres_intervention,
        recommendation: data.recommendation,
        duree_arret: data.duree_arret,
        maintenance_type: data.maintenance_type || undefined,
      };

      const newIncident = await apiClient.createIncident(incidentData);
      // Reload all incidents to ensure we have the latest data
      await loadIncidents();
      loadStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'incident matériel");
      throw err;
    }
  };

  const addSoftwareIncident = async (data: IncidentFormData) => {
    try {
      // Time should already be set from form, but ensure it's in HH:MM format
      let incidentTime = data.time;
      if (!incidentTime || incidentTime.trim() === '') {
        // Fallback to current UTC time if somehow empty
        const now = new Date();
        const utcHours = String(now.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
        incidentTime = `${utcHours}:${utcMinutes}`;
      }
      // Ensure time is in HH:MM format (remove seconds if present)
      if (incidentTime.includes(':')) {
        const parts = incidentTime.split(':');
        incidentTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      
      const incidentData = {
        incident_type: 'software' as const,
        date: data.date,
        time: incidentTime,
        server: data.server || undefined,
        partition: data.partition || undefined,
        position: data.position || undefined,
        type_d_anomalie: data.type_d_anomalie || undefined,
        call_sign: data.call_sign || undefined,
        nom_radar: data.nom_radar || undefined,
        FL: data.FL || undefined,
        longitude: data.longitude || undefined,
        latitude: data.latitude || undefined,
        code_SSR: data.code_SSR || undefined,
        sujet: data.sujet || undefined,
        description: data.description,
        commentaires: data.commentaires || undefined,
      };

      const newIncident = await apiClient.createIncident(incidentData);
      // Reload all incidents to ensure we have the latest data
      await loadIncidents();
      loadStats(); // Refresh stats
      return newIncident; // Return the created incident
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'incident logiciel");
      throw err;
    }
  };

  const deleteHardwareIncident = async (id: number) => {
    try {
      await apiClient.deleteIncident(id);
      setHardwareIncidents(prev => prev.filter(i => i.id !== id));
      loadStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression de l'incident");
      throw err;
    }
  };

  const updateHardwareIncident = async (id: number, data: IncidentFormData) => {
    try {
      const incidentData = {
        incident_type: 'hardware' as const,
        date: data.date,
        time: data.time,
        nom_de_equipement: data.nom_de_equipement,
        partition: data.partition,
        numero_de_serie: data.numero_de_serie,
        description: data.description,
        anomalie_observee: data.anomalie_observee,
        action_realisee: data.action_realisee,
        piece_de_rechange_utilisee: data.piece_de_rechange_utilisee,
        etat_de_equipement_apres_intervention: data.etat_de_equipement_apres_intervention,
        recommendation: data.recommendation,
        duree_arret: data.duree_arret,
        maintenance_type: data.maintenance_type || undefined,
      };

      const updatedIncident = await apiClient.updateIncident(id, incidentData);
      setHardwareIncidents(prev => prev.map(i => i.id === id ? updatedIncident : i));
      loadStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de l'incident");
      throw err;
    }
  };

  const updateSoftwareIncident = async (id: number, data: IncidentFormData) => {
    try {
      const incidentData = {
        incident_type: 'software' as const,
        date: data.date,
        time: data.time,
        server: data.server,
        partition: data.partition,
        position: data.position,
        type_d_anomalie: data.type_d_anomalie,
        call_sign: data.call_sign,
        nom_radar: data.nom_radar,
        FL: data.FL,
        longitude: data.longitude,
        latitude: data.latitude,
        code_SSR: data.code_SSR,
        sujet: data.sujet,
        description: data.description,
        commentaires: data.commentaires,
      };

      const updatedIncident = await apiClient.updateIncident(id, incidentData);
      setSoftwareIncidents(prev => prev.map(i => i.id === id ? updatedIncident : i));
      loadStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de l'incident");
      throw err;
    }
  };

  const deleteSoftwareIncident = async (id: number) => {
    try {
      await apiClient.deleteIncident(id);
      setSoftwareIncidents(prev => prev.filter(i => i.id !== id));
      setReports(prev => prev.filter(r => r.incident !== id));
      loadStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression de l'incident");
      throw err;
    }
  };

  const addReport = async (
    incidentId: number,
    data: { anomaly: string; analysis: string; conclusion: string }
  ) => {
    try {
      // Date, time, and anomaly will be auto-filled by the backend from the incident
      const reportData = {
        incident: incidentId,
        anomaly: data.anomaly, // This can be overridden, but will default to incident's commentaires
        analysis: data.analysis,
        conclusion: data.conclusion,
      };

      const report = await apiClient.createReport(reportData as any);
      
      // Update reports state - either add new or update existing
      setReports(prev => {
        const existingIndex = prev.findIndex(r => r.incident === incidentId);
        if (existingIndex >= 0) {
          // Update existing report
          const updated = [...prev];
          updated[existingIndex] = report;
          return updated;
        } else {
          // Add new report
          return [report, ...prev];
        }
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création/modification du rapport");
      throw err;
    }
  };

  const getReports = useCallback(async (incidentId: number) => {
    try {
      const response = await apiClient.getReports({ incident: incidentId }) as any;
      return response.results || [];
    } catch (err: any) {
      console.error("Error loading reports:", err);
      return [];
    }
  }, []);

  const refreshIncidents = () => {
    loadIncidents();
    loadStats();
  };

  return {
    hardwareIncidents,
    softwareIncidents,
    reports,
    stats,
    loading,
    error,
    addHardwareIncident,
    addSoftwareIncident,
    updateHardwareIncident,
    updateSoftwareIncident,
    deleteHardwareIncident,
    deleteSoftwareIncident,
    addReport,
    getReports,
    refreshIncidents,
  };
}
