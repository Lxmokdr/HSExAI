import { IncidentForm, IncidentFormData } from "@/components/IncidentForm";
import { useIncidents } from "@/hooks/useIncidents";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

export default function SoftwareIncidents() {
  const {  addSoftwareIncident } = useIncidents();
  const permissions = usePermissions();

  const handleSubmit = async (data: IncidentFormData) => {
    try {
      await addSoftwareIncident(data);
      toast.success("Incident logiciel ajouté avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de l'incident"); 
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des Incidents Software
        </h1>
        <p className="text-muted-foreground">
          Enregistrer et suivre les incidents liés aux logiciels (Software)
        </p>
      </div>

      {permissions.canModifySoftwareIncidents && (
      <IncidentForm
        onSubmit={handleSubmit}
        type="software"
        title="Nouveau incident software"
      />
      )}
      {!permissions.canModifySoftwareIncidents && (
        <div className="text-center py-8 text-muted-foreground">
          Accès en lecture seule. Vous ne pouvez pas créer de nouveaux incidents logiciels.
        </div>
      )}
    </div>
  );
}
