import { useState } from "react";
import { useEquipment } from "@/hooks/useEquipment";
import { usePermissions } from "@/hooks/usePermissions";
import type { Equipment } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, History } from "lucide-react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { apiClient, Incident } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IncidentTable } from "@/components/IncidentTable";

// Equipment names - image equipment with ALER prefix + partition list as equipment
const EQUIPMENT_NAMES = [
  // Servers (with ALER prefix)
  "ALER Serveur traitement radar (RTP1A)",
  "ALER Serveur traitement radar (RTP1B)",
  "ALER Serveur traitement données de vol (FDP1A)",
  "ALER Serveur traitement données de vol (FDP1B)",
  "ALER Serveur traitement données AIR SOL (AGP1A)",
  "ALER Serveur traitement données AIR SOL (AGP1B)",
  "ALER Serveur DRA01",
  "ALER Serveur multi traking radar (MTP1A)",
  "ALER Serveur multi traking radar (MTP1B)",
  "ALER Serveur Communication inter partition CDP1A",
  "ALER Serveur Communication inter partition CDP1B",
  "ALER Serveur d'enregistrement REC1A",
  "ALER Serveur d'enregistrement REC1B",
  "ALER Serveur de rejeu REP1A",
  "ALER Serveur données radar brut genspar01",
  "ALER Serveur données radar brut genspar03",
  "ALER Serveur de visualisation swap01",
  "ALER Serveur base de données DBM",
  "ALER Serveur smde",
  // Routers (with ALER prefix)
  "ALER ROUTEUR 01 CISCO 2600",
  "ALER ROUTEUR 02 CISCO 2600",
  "ALER ROUTEUR 03 CISCO 2600",
  "ALER ROUTEUR 04 CISCO 2600",
  "ALER ROUTEUR 05 CISCO 2600",
  // Switches (with ALER prefix)
  "ALER SWITCH Cisco 2950 ops 1A 48 P",
  "ALER SWITCH Cisco 2950 ops 2A 48 P",
  "ALER SWITCH Cisco 2950 ops 1B 48 P",
  "ALER SWITCH Cisco 2950 ops 2B 48 P",
  "ALER SWITCH Cisco3500XL service 48 P",
  // Additional equipment (from previous partitions list)
  "ALEREXC01",
  "ALEREXC03",
  "ALEREXC05",
  "ALEREXC07",
  "ALEREXC08",
  "ALEREXC09",
  "ALEREXC10",
  "ALEREXC11",
  "ALERPLC01",
  "ALERPLC03",
  "ALERPLC05",
  "ALERPLC07",
  "ALERPLC08",
  "ALERPLC09",
  "ALERPLC10",
  "ALERPLC11",
  "ALERMIL01",
  "ALEROPS",
  "ALERFDO01DA",
  "ALERFDOX01",
];

interface EquipmentFormData {
  num_serie: string;
  nom_equipement: string;
  partition: string;
  etat: string;
}

export default function Equipment() {
  const { equipment, loading, addEquipment, updateEquipment, deleteEquipment, refreshEquipment } = useEquipment();
  const permissions = usePermissions();
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    num_serie: "",
    nom_equipement: "",
    partition: "ALER",
    etat: "actuel",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [equipmentHistory, setEquipmentHistory] = useState<Incident[]>([]);
  const [historyEquipment, setHistoryEquipment] = useState<Equipment | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateEquipment(isEditing, {
          num_serie: formData.num_serie || undefined,
          nom_equipement: formData.nom_equipement,
          partition: formData.partition,
        });
        toast.success("Équipement modifié avec succès. L'ancien état a été marqué comme 'historique' et un nouvel enregistrement a été créé.");
      } else {
        await addEquipment({
          num_serie: formData.num_serie || undefined,
          nom_equipement: formData.nom_equipement,
          partition: formData.partition,
          etat: "actuel",
        });
        toast.success("Équipement ajouté avec succès");
      }
      // Reset form
      setFormData({
        num_serie: "",
        nom_equipement: "",
        partition: "ALER",
        etat: "actuel",
      });
      setIsEditing(null);
    } catch (error: any) {
      toast.error(error.message || `Erreur lors de ${isEditing ? 'la modification' : "l'ajout"} de l'équipement`);
    }
  };

  const handleDelete = (id: number) => {
    setEquipmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (equipmentToDelete) {
      try {
        await deleteEquipment(equipmentToDelete);
        toast.success("Équipement supprimé");
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression");
      }
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const handleViewHistory = async (equipmentId: number) => {
    try {
      setLoadingHistory(true);
      const history = await apiClient.getEquipmentHistory(equipmentId);
      setEquipmentHistory(history.incidents);
      setHistoryEquipment(history.equipment);
      setHistoryDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de l'historique");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des Équipements
        </h1>
        <p className="text-muted-foreground">
          Enregistrer et gérer les équipements opérationnels
        </p>
      </div>

      {permissions.canModifyEquipment && (
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Modifier l'équipement" : "Nouvel équipement"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_equipement">Nom de l'équipement *</Label>
              <Select
                value={formData.nom_equipement}
                onValueChange={(value) =>
                  setFormData({ ...formData, nom_equipement: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un équipement" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partition">Partition *</Label>
                <Input
                  id="partition"
                  value={formData.partition}
                  onChange={(e) =>
                    setFormData({ ...formData, partition: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_serie">Numéro de série</Label>
                <Input
                  id="num_serie"
                  placeholder="Ex: SN123456"
                  value={formData.num_serie}
                  onChange={(e) =>
                    setFormData({ ...formData, num_serie: e.target.value })
                  }
                />
              </div>
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="etat">État</Label>
                <Input
                  id="etat"
                  value={formData.etat}
                  onChange={(e) =>
                    setFormData({ ...formData, etat: e.target.value })
                  }
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  L'état sera automatiquement défini à "actuel" pour les nouveaux équipements
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit">
                {isEditing ? "Modifier" : "Ajouter"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(null);
                    setFormData({
                      num_serie: "",
                      nom_equipement: "",
                      partition: "ALER",
                      etat: "actuel",
                    });
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      )}
      {!permissions.canModifyEquipment && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Accès en lecture seule. Vous ne pouvez pas créer ou modifier des équipements.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Liste des équipements
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom de l'équipement</TableHead>
                    <TableHead>Partition</TableHead>
                    <TableHead>Numéro de série</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucun équipement enregistré
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="font-medium">
                          {item.nom_equipement}
                        </TableCell>
                        <TableCell>{item.partition}</TableCell>
                        <TableCell>{item.num_serie || "-"}</TableCell>
                        <TableCell>{item.etat || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(item.id)}
                              title="Voir l'historique"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            {permissions.canModifyEquipment && (
                              <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsEditing(item.id);
                                setFormData({
                                  num_serie: item.num_serie || "",
                                  nom_equipement: item.nom_equipement,
                                  partition: item.partition,
                                  etat: "actuel",
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer l'équipement"
        description="Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible."
      />

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Historique des incidents - {historyEquipment?.nom_equipement}
            </DialogTitle>
            <DialogDescription>
              {historyEquipment && (
                <div className="mt-2 space-y-1">
                  <p><strong>Numéro de série:</strong> {historyEquipment.num_serie || "N/A"}</p>
                  <p><strong>Partition:</strong> {historyEquipment.partition}</p>
                  <p><strong>Total d'incidents:</strong> {equipmentHistory.length}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Chargement de l'historique...</div>
            </div>
          ) : equipmentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun incident enregistré pour cet équipement
            </div>
          ) : (
            <IncidentTable incidents={equipmentHistory} onRefresh={() => {}} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

