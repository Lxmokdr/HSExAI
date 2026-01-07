import { useState, useMemo } from "react";
import { IncidentForm, IncidentFormData } from "@/components/IncidentForm";
import { IncidentTable } from "@/components/IncidentTable";
import { useIncidents } from "@/hooks/useIncidents";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function HardwareIncidents() {
  const { hardwareIncidents, addHardwareIncident, updateHardwareIncident, deleteHardwareIncident } = useIncidents();
  const permissions = usePermissions();
  const [editingIncidentId, setEditingIncidentId] = useState<number | null>(null);

  const editingIncident = useMemo(() => {
    return hardwareIncidents.find(i => i.id === editingIncidentId);
  }, [hardwareIncidents, editingIncidentId]);

  const handleSubmit = async (data: IncidentFormData) => {
    try {
      if (editingIncidentId) {
        await updateHardwareIncident(editingIncidentId, data);
        toast.success("Incident matériel modifié avec succès");
        setEditingIncidentId(null);
      } else {
        await addHardwareIncident(data);
        toast.success("Incident matériel ajouté avec succès");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement de l'incident");
    }
  };

  const handleEdit = (id: number) => {
    setEditingIncidentId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHardwareIncident(id);
      toast.success("Incident matériel supprimé");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  // Map incident data to IncidentFormData format for the form
  const initialData = useMemo(() => {
    if (!editingIncident) return undefined;

    return {
      date: editingIncident.date,
      time: editingIncident.time,
      description: editingIncident.description,
      nom_de_equipement: editingIncident.nom_de_equipement,
      partition: editingIncident.partition,
      numero_de_serie: editingIncident.numero_de_serie,
      anomalie_observee: editingIncident.anomalie_observee,
      action_realisee: editingIncident.action_realisee,
      piece_de_rechange_utilisee: editingIncident.piece_de_rechange_utilisee,
      etat_de_equipement_apres_intervention: editingIncident.etat_de_equipement_apres_intervention,
      recommendation: editingIncident.recommendation,
      duree_arret: editingIncident.duree_arret,
      maintenance_type: editingIncident.maintenance_type,
    } as Partial<IncidentFormData>;
  }, [editingIncident]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {editingIncidentId ? `Modifier l'incident #${editingIncidentId}` : "Gestion des Incidents Hardware"}
          </h1>
          <p className="text-muted-foreground">
            {editingIncidentId
              ? "Mettre à jour les informations de l'incident sélectionné"
              : "Enregistrer et suivre les incidents liés au matériel (Hardware)"}
          </p>
        </div>

        {editingIncidentId && (
          <Button
            variant="outline"
            onClick={() => setEditingIncidentId(null)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau incident
          </Button>
        )}
      </div>

      {permissions.canModifyHardwareIncidents && (
        <IncidentForm
          onSubmit={handleSubmit}
          type="hardware"
          title={editingIncidentId ? "Modifier l'incident hardware" : "Nouveau incident hardware"}
          initialData={initialData}
        />
      )}
      {!permissions.canModifyHardwareIncidents && (
        <div className="text-center py-8 text-muted-foreground">
          Accès en lecture seule. Vous ne pouvez pas créer de nouveaux incidents matériels.
        </div>
      )}

      {/* Recent Incidents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents récents</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentTable
            incidents={hardwareIncidents.slice(0, 5)}
            onEdit={permissions.canModifyHardwareIncidents ? handleEdit : undefined}
            onDelete={permissions.canModifyHardwareIncidents ? handleDelete : undefined}
          />
        </CardContent>
      </Card>

    </div>
  );
}
