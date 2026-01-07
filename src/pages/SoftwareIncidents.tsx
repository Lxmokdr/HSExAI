import { useState, useMemo } from "react";
import { IncidentForm, IncidentFormData } from "@/components/IncidentForm";
import { IncidentTable } from "@/components/IncidentTable";
import { useIncidents } from "@/hooks/useIncidents";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function SoftwareIncidents() {
  const { softwareIncidents, addSoftwareIncident, updateSoftwareIncident, deleteSoftwareIncident } = useIncidents();
  const permissions = usePermissions();
  const [editingIncidentId, setEditingIncidentId] = useState<number | null>(null);

  const editingIncident = useMemo(() => {
    return softwareIncidents.find(i => i.id === editingIncidentId);
  }, [softwareIncidents, editingIncidentId]);

  const handleSubmit = async (data: IncidentFormData) => {
    try {
      if (editingIncidentId) {
        await updateSoftwareIncident(editingIncidentId, data);
        toast.success("Incident logiciel modifié avec succès");
        setEditingIncidentId(null);
      } else {
        const newIncident = await addSoftwareIncident(data);
        toast.success("Incident logiciel ajouté avec succès");
        return newIncident;
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement de l'incident");
      throw error;
    }
  };

  const handleEdit = (id: number) => {
    setEditingIncidentId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSoftwareIncident(id);
      toast.success("Incident logiciel supprimé");
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
      partition: editingIncident.partition,
      server: editingIncident.server,
      position: editingIncident.position,
      type_d_anomalie: editingIncident.type_d_anomalie,
      call_sign: editingIncident.call_sign,
      nom_radar: editingIncident.nom_radar,
      FL: editingIncident.FL,
      longitude: editingIncident.longitude,
      latitude: editingIncident.latitude,
      code_SSR: editingIncident.code_SSR,
      sujet: editingIncident.sujet,
      commentaires: editingIncident.commentaires,
    } as Partial<IncidentFormData>;
  }, [editingIncident]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {editingIncidentId ? `Modifier l'incident #${editingIncidentId}` : "Gestion des Incidents Software"}
          </h1>
          <p className="text-muted-foreground">
            {editingIncidentId
              ? "Mettre à jour les informations de l'incident sélectionné"
              : "Enregistrer et suivre les incidents liés aux logiciels (Software)"}
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

      {permissions.canModifySoftwareIncidents && (
        <IncidentForm
          onSubmit={handleSubmit}
          type="software"
          title={editingIncidentId ? "Modifier l'incident software" : "Nouveau incident software"}
          initialData={initialData}
        />
      )}
      {!permissions.canModifySoftwareIncidents && (
        <div className="text-center py-8 text-muted-foreground">
          Accès en lecture seule. Vous ne pouvez pas créer de nouveaux incidents logiciels.
        </div>
      )}

      {/* Recent Incidents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents récents</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentTable
            incidents={softwareIncidents.slice(0, 5)}
            onEdit={permissions.canModifySoftwareIncidents ? handleEdit : undefined}
            onDelete={permissions.canModifySoftwareIncidents ? handleDelete : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
