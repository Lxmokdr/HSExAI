import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IncidentForm, IncidentFormData } from "@/components/IncidentForm";
import { useIncidents } from "@/hooks/useIncidents";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function EditIncident() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hardwareIncidents, softwareIncidents, updateHardwareIncident, updateSoftwareIncident } = useIncidents();

  const incident = [...hardwareIncidents, ...softwareIncidents].find(i => i.id === Number(id));
  const isHardware = incident?.incident_type === 'hardware';

  const handleSubmit = async (data: IncidentFormData) => {
    if (!incident) return;

    try {
      if (isHardware) {
        await updateHardwareIncident(Number(id), data);
        toast.success("Incident matériel modifié avec succès");
      } else {
        await updateSoftwareIncident(Number(id), data);
        toast.success("Incident logiciel modifié avec succès");
      }
      navigate(-1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification de l'incident");
    }
  };

  // Map incident data to IncidentFormData format
  const initialData: Partial<IncidentFormData> = incident ? {
    date: incident.date,
    time: incident.time,
    description: incident.description,
    nom_de_equipement: incident.nom_de_equipement,
    partition: incident.partition,
    numero_de_serie: incident.numero_de_serie,
    anomalie_observee: incident.anomalie_observee,
    action_realisee: incident.action_realisee,
    piece_de_rechange_utilisee: incident.piece_de_rechange_utilisee,
    etat_de_equipement_apres_intervention: incident.etat_de_equipement_apres_intervention,
    recommendation: incident.recommendation,
    duree_arret: incident.duree_arret,
    maintenance_type: incident.maintenance_type,
    server: incident.server,
    position: incident.position,
    type_d_anomalie: incident.type_d_anomalie,
    call_sign: incident.call_sign,
    nom_radar: incident.nom_radar,
    FL: incident.FL,
    longitude: incident.longitude,
    latitude: incident.latitude,
    code_SSR: incident.code_SSR,
    sujet: incident.sujet,
    commentaires: incident.commentaires,
  } : {};

  if (!incident) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <div className="text-center text-muted-foreground py-8">
          <p>Incident non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Modifier l'incident #{incident.id}
          </h1>
          <p className="text-muted-foreground">
            {isHardware ? "Incident matériel" : "Incident logiciel"}
          </p>
        </div>
      </div>

      <IncidentForm
        onSubmit={handleSubmit}
        type={isHardware ? "hardware" : "software"}
        title="Modifier l'incident"
        initialData={initialData}
      />
    </div>
  );
}
