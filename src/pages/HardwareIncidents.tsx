import { IncidentForm, IncidentFormData } from "@/components/IncidentForm";
import { useIncidents } from "@/hooks/useIncidents";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

export default function HardwareIncidents() {
  const { addHardwareIncident } = useIncidents();
  const permissions = usePermissions();

  const handleSubmit = async (data: IncidentFormData) => {
    try {
      await addHardwareIncident(data);
      toast.success("Incident matériel ajouté avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de l'incident");
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des Incidents Hardware
        </h1>
        <p className="text-muted-foreground">
          Enregistrer et suivre les incidents liés au matériel (Hardware)
        </p>
      </div>

      {permissions.canModifyHardwareIncidents && (
      <IncidentForm
        onSubmit={handleSubmit}
        type="hardware"
        title="Nouveau incident hardware"
      />
      )}
      {!permissions.canModifyHardwareIncidents && (
        <div className="text-center py-8 text-muted-foreground">
          Accès en lecture seule. Vous ne pouvez pas créer de nouveaux incidents matériels.
        </div>
      )}

    </div>
  );
}
