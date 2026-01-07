// React imports
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// React Router imports
import { useNavigate } from "react-router-dom";

// Third-party imports
import { History, FileText } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

// Local service imports
import { apiClient, Equipment, Incident } from "@/services/api";
import { useIncidents } from "@/hooks/useIncidents";

// Local component imports
import { IncidentTable } from "@/components/IncidentTable";

// UI component imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Equipment names - same list as in Equipment.tsx
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

interface IncidentFormProps {
  onSubmit: (data: IncidentFormData) => void | Promise<void> | Promise<any>;
  type: "hardware" | "software";
  title?: string;
  initialData?: Partial<IncidentFormData>;
}

export interface IncidentFormData {
  date: string;
  time: string;
  description: string;
  // Hardware fields
  nom_de_equipement?: string;
  partition?: string;
  numero_de_serie?: string;
  anomalie_observee?: string;
  action_realisee?: string;
  piece_de_rechange_utilisee?: string;
  etat_de_equipement_apres_intervention?: string;
  recommendation?: string;
  duree_arret?: number;
  maintenance_type?: 'preventive' | 'corrective';
  // Software fields
  server?: string;
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

export function IncidentForm({ onSubmit, type, title, initialData }: IncidentFormProps) {
  const navigate = useNavigate();
  const { addReport } = useIncidents();
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    anomaly: "",
    analysis: "",
    conclusion: "",
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [lastCreatedIncidentId, setLastCreatedIncidentId] = useState<number | null>(null);
  const [availableSerialNumbers, setAvailableSerialNumbers] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [serialNumberSearchQuery, setSerialNumberSearchQuery] = useState<string>("");
  const [showSerialDropdown, setShowSerialDropdown] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const serialInputRef = useRef<HTMLInputElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingFromDropdownRef = useRef(false);
  const equipmentNameManuallyChangedRef = useRef(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [equipmentHistory, setEquipmentHistory] = useState<Incident[]>([]);
  const [historyEquipment, setHistoryEquipment] = useState<Equipment | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Get default date and time (GMT/UTC)
  const getDefaultDate = () => {
    if (initialData?.date) return initialData.date;
    // Use UTC date (toISOString() returns UTC)
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format in UTC
  };

  const getDefaultTime = () => {
    if (initialData?.time) return initialData.time;
    // Always use UTC/GMT time, not local time
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    return `${utcHours}:${utcMinutes}`; // HH:MM format in GMT/UTC
  };

  const [formData, setFormData] = useState<IncidentFormData>({
    date: getDefaultDate(),
    time: getDefaultTime(),
    description: initialData?.description || "",
    nom_de_equipement: initialData?.nom_de_equipement || "",
    partition: initialData?.partition || "",
    numero_de_serie: initialData?.numero_de_serie || "",
    anomalie_observee: initialData?.anomalie_observee || "",
    action_realisee: initialData?.action_realisee || "",
    piece_de_rechange_utilisee: initialData?.piece_de_rechange_utilisee || "",
    etat_de_equipement_apres_intervention: initialData?.etat_de_equipement_apres_intervention || "",
      recommendation: initialData?.recommendation || "",
      duree_arret: initialData?.duree_arret || undefined,
      maintenance_type: initialData?.maintenance_type || undefined,
      server: initialData?.server || "",
      position: initialData?.position || "",
      type_d_anomalie: initialData?.type_d_anomalie || "",
      call_sign: initialData?.call_sign || "",
      nom_radar: initialData?.nom_radar || "",
    FL: initialData?.FL || "",
    longitude: initialData?.longitude || "",
    latitude: initialData?.latitude || "",
    code_SSR: initialData?.code_SSR || "",
    sujet: initialData?.sujet || "",
    commentaires: initialData?.commentaires || "",
  });

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
      // Reset manual change flag when loading initial data for editing
      equipmentNameManuallyChangedRef.current = false;
    }
  }, [initialData?.date, initialData?.time, initialData?.description, initialData?.numero_de_serie, initialData?.nom_de_equipement, initialData?.partition]);

  // Auto-fill report anomaly from incident description when description changes (for software incidents)
  useEffect(() => {
    if (type === "software" && !initialData && formData.description && !reportFormData.anomaly) {
      setReportFormData(prev => ({
        ...prev,
        anomaly: formData.description,
      }));
    }
  }, [formData.description, type, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any pending API calls that might override manual changes
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    // Submit the current form data (which includes manually selected equipment name)
    // Use a copy to ensure we're submitting the exact current state
    const result = await onSubmit({ ...formData });
    
    // Store the created incident ID for report submission (for software incidents)
    if (type === "software" && !initialData && result && typeof result === 'object' && result !== null && 'id' in result) {
      setLastCreatedIncidentId((result as any).id);
    }
    // Only reset form if not editing (no initialData)
    if (!initialData) {
      const now = new Date();
      // Use UTC date (toISOString() returns UTC)
      const defaultDate = now.toISOString().split('T')[0];
      // Use UTC/GMT time for default
      const defaultHours = String(now.getUTCHours()).padStart(2, '0');
      const defaultMinutes = String(now.getUTCMinutes()).padStart(2, '0');
      const defaultTime = `${defaultHours}:${defaultMinutes}`;
      
      setFormData({
        date: defaultDate,
        time: defaultTime,
        description: "",
        nom_de_equipement: "",
        partition: "",
        numero_de_serie: "",
        anomalie_observee: "",
        action_realisee: "",
        piece_de_rechange_utilisee: "",
        etat_de_equipement_apres_intervention: "",
        recommendation: "",
        duree_arret: undefined,
        maintenance_type: undefined,
        server: "",
        position: "",
        type_d_anomalie: "",
        call_sign: "",
        nom_radar: "",
      FL: "",
      longitude: "",
      latitude: "",
      code_SSR: "",
      sujet: "",
      commentaires: "",
      });
      
      // Reset report form and last created incident ID
      if (type === "software") {
        setReportFormData({ anomaly: "", analysis: "", conclusion: "" });
        setLastCreatedIncidentId(null);
      }
    }
  };

  // Fetch equipment details when serial number is selected/entered
  const fetchEquipmentBySerial = useCallback(async (serialNumber: string) => {
    // Don't fetch if equipment name was manually changed
    if (equipmentNameManuallyChangedRef.current) {
      return;
    }
    
    if (!serialNumber || serialNumber.trim().length === 0) {
      setFormData(prev => ({
        ...prev,
        nom_de_equipement: "",
        partition: "",
      }));
      setSelectedEquipmentId(null);
      return;
    }

    // Store current focus state
    const wasFocused = document.activeElement === serialInputRef.current;
    
    setEquipmentLoading(true);
    try {
      const trimmedSerial = serialNumber.trim();
      const result = await apiClient.getEquipment({ num_serie: trimmedSerial });
      
      // Backend returns Equipment object directly when searching by exact num_serie
      let equipment: Equipment | null = null;
      
      // Check if result is a direct Equipment object
      if (result && typeof result === 'object') {
        if ('nom_equipement' in result) {
          // Direct Equipment object
          equipment = result as Equipment;
        } else if ('results' in result) {
          // Wrapped in results array (shouldn't happen for num_serie, but handle it)
          const resultsObj = result as { results: Equipment[] | string[] };
          if (Array.isArray(resultsObj.results) && resultsObj.results.length > 0) {
            const firstItem = resultsObj.results[0];
            if (typeof firstItem === 'object' && firstItem !== null && 'nom_equipement' in firstItem) {
              equipment = firstItem as Equipment;
            }
          }
        }
      }
      
      if (equipment && equipment.nom_equipement) {
        // Double-check flag again here in case it changed during the API call
        // Update form data with equipment details
        // But only if equipment name hasn't been manually changed
        if (!equipmentNameManuallyChangedRef.current) {
          setFormData(prev => ({
            ...prev,
            nom_de_equipement: equipment.nom_equipement,
            partition: equipment.partition || "",
            numero_de_serie: equipment.num_serie || trimmedSerial,
          }));
          setSelectedEquipmentId(equipment.id);
          // Update search query to match
          setSerialNumberSearchQuery(equipment.num_serie || trimmedSerial);
        } else {
          // Equipment name was manually changed - don't override it
          // Only update partition and serial number, keep manual equipment name
          setFormData(prev => ({
            ...prev,
            partition: equipment.partition || prev.partition || "",
            numero_de_serie: equipment.num_serie || trimmedSerial,
            // Explicitly preserve the current nom_de_equipement
            nom_de_equipement: prev.nom_de_equipement,
          }));
          setSelectedEquipmentId(equipment.id);
          // Don't update search query if manually changed
        }
      } else {
        // No equipment found - keep serial number but clear other fields
        setFormData(prev => ({
          ...prev,
          nom_de_equipement: "",
          partition: "",
        }));
        setSelectedEquipmentId(null);
      }
      
      // Restore focus if it was focused before
      if (wasFocused && serialInputRef.current) {
        requestAnimationFrame(() => {
          if (serialInputRef.current) {
            serialInputRef.current.focus();
            // Move cursor to end
            const length = serialInputRef.current.value.length;
            serialInputRef.current.setSelectionRange(length, length);
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching equipment by serial number:', error);
      // Equipment not found - keep serial number but clear other fields
      setFormData(prev => ({
        ...prev,
        nom_de_equipement: "",
        partition: "",
      }));
      setSelectedEquipmentId(null);
      
      // Restore focus if it was focused before
      if (wasFocused && serialInputRef.current) {
        requestAnimationFrame(() => {
          if (serialInputRef.current) {
            serialInputRef.current.focus();
            const length = serialInputRef.current.value.length;
            serialInputRef.current.setSelectionRange(length, length);
          }
        });
      }
    } finally {
      setEquipmentLoading(false);
    }
  }, []);

  // Load all available equipment on mount for hardware incidents
  useEffect(() => {
    if (type === "hardware") {
      const loadAllEquipment = async () => {
        try {
          setEquipmentLoading(true);
          // Get all equipment
          const result = await apiClient.getEquipment();
          if (result && typeof result === 'object' && 'results' in result && Array.isArray(result.results)) {
            const equipmentList = result.results.filter((item): item is Equipment => 
              typeof item === 'object' && item !== null && 'nom_equipement' in item
            );
            // Get current equipment (etat = 'actuel')
            const currentEquipment = equipmentList.filter(eq => eq.etat === 'actuel');
            setAvailableEquipment(currentEquipment);
            // Get unique serial numbers
            const uniqueSerials = Array.from(new Set(currentEquipment.map(eq => eq.num_serie).filter(Boolean))) as string[];
            setAvailableSerialNumbers(uniqueSerials.sort());
          } else {
            setAvailableEquipment([]);
            setAvailableSerialNumbers([]);
          }
        } catch (error: any) {
          console.error('Error loading equipment:', error);
          setAvailableEquipment([]);
          setAvailableSerialNumbers([]);
        } finally {
          setEquipmentLoading(false);
        }
      };
      loadAllEquipment();
    } else {
      setAvailableEquipment([]);
      setAvailableSerialNumbers([]);
    }
  }, [type]);

  // Filter equipment by serial number based on search query
  const filteredSerialNumbers = useMemo(() => {
    if (!serialNumberSearchQuery.trim()) {
      // Show first 10 equipment with serial numbers when no search
      return availableEquipment.filter(eq => eq.num_serie).slice(0, 10);
    }
    const query = serialNumberSearchQuery.toLowerCase();
    return availableEquipment.filter(eq => 
      eq.num_serie && eq.num_serie.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [availableEquipment, serialNumberSearchQuery]);

  // Handle serial number selection from autocomplete
  const handleSerialNumberSelect = (equipment: Equipment) => {
    // Reset manual change flag when selecting from dropdown
    equipmentNameManuallyChangedRef.current = false;
    setFormData(prev => ({
      ...prev,
      nom_de_equipement: equipment.nom_equipement,
      partition: equipment.partition || "",
      numero_de_serie: equipment.num_serie || "",
    }));
    setSelectedEquipmentId(equipment.id);
    setSerialNumberSearchQuery(equipment.num_serie || "");
    setShowSerialDropdown(false);
  };

  // Handle viewing equipment history
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
    <Card>
      <CardHeader>
        <CardTitle>{title || "Ajouter un incident"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Heure (GMT)</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                L'heure doit être en GMT/UTC (actuellement: {(() => {
                  const now = new Date();
                  const utcHours = String(now.getUTCHours()).padStart(2, '0');
                  const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
                  return `${utcHours}:${utcMinutes}`;
                })()} GMT)
              </p>
            </div>
          </div>

          {type === "hardware" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="numero_de_serie">Numéro de série *</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={serialInputRef}
                        id="numero_de_serie"
                        value={serialNumberSearchQuery}
                        onChange={(e) => {
                          const serial = e.target.value;
                          const input = e.target;
                          const cursorPosition = input.selectionStart || 0;
                          
                          setSerialNumberSearchQuery(serial);
                          setShowSerialDropdown(true);
                          isSelectingFromDropdownRef.current = false;
                          // Also update form data
                          setFormData(prev => ({ ...prev, numero_de_serie: serial }));
                          
                          // Clear any pending fetch timeout
                          if (fetchTimeoutRef.current) {
                            clearTimeout(fetchTimeoutRef.current);
                          }
                          
                          // Restore cursor position after state update
                          requestAnimationFrame(() => {
                            if (serialInputRef.current && document.activeElement === serialInputRef.current) {
                              serialInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                            }
                          });
                          
                          // If exact match found, auto-fill equipment details
                          // But only if equipment name hasn't been manually changed
                          if (serial) {
                            const exactMatch = availableEquipment.find(
                              eq => eq.num_serie && eq.num_serie.toLowerCase() === serial.toLowerCase()
                            );
                            if (exactMatch) {
                              if (!equipmentNameManuallyChangedRef.current) {
                                // Auto-fill all fields if not manually changed
                                setFormData(prev => ({
                                  ...prev,
                                  nom_de_equipement: exactMatch.nom_equipement,
                                  partition: exactMatch.partition || "",
                                  numero_de_serie: exactMatch.num_serie || "",
                                }));
                              } else {
                                // Only update partition and serial, keep manual equipment name
                                setFormData(prev => ({
                                  ...prev,
                                  partition: exactMatch.partition || prev.partition || "",
                                  numero_de_serie: exactMatch.num_serie || "",
                                }));
                              }
                              setSelectedEquipmentId(exactMatch.id);
                            } else {
                              setSelectedEquipmentId(null);
                              // Debounce API call to avoid interrupting typing
                              // Only fetch if user stopped typing (no new input for 2 seconds)
                              // And only if equipment name hasn't been manually changed
                              if (!equipmentNameManuallyChangedRef.current) {
                                fetchTimeoutRef.current = setTimeout(() => {
                                  // Double-check the input still has focus and value hasn't changed
                                  if (serialInputRef.current && 
                                      document.activeElement === serialInputRef.current &&
                                      serialInputRef.current.value === serial) {
                                    fetchEquipmentBySerial(serial);
                                  }
                                }, 2000);
                              }
                            }
                          } else {
                            setSelectedEquipmentId(null);
                          }
                        }}
                        onFocus={() => {
                          setShowSerialDropdown(true);
                          isSelectingFromDropdownRef.current = false;
                        }}
                        onBlur={(e) => {
                          // Don't close if we're selecting from dropdown
                          if (isSelectingFromDropdownRef.current) {
                            return;
                          }
                          // Delay to allow click on dropdown items
                          setTimeout(() => {
                            // Check if focus moved to dropdown
                            const activeElement = document.activeElement;
                            const dropdown = document.querySelector('.serial-dropdown');
                            if (!dropdown || !dropdown.contains(activeElement)) {
                              setShowSerialDropdown(false);
                            }
                          }, 200);
                        }}
                        placeholder="Tapez le numéro de série..."
                        disabled={equipmentLoading}
                        required
                        autoComplete="off"
                      />
                      {showSerialDropdown && filteredSerialNumbers.length > 0 && (
                        <div className="serial-dropdown absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredSerialNumbers.map((eq) => (
                            <div
                              key={eq.id}
                              className="px-4 py-2 hover:bg-muted cursor-pointer"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                isSelectingFromDropdownRef.current = true;
                                handleSerialNumberSelect(eq);
                                // Keep focus on input after selection
                                setTimeout(() => {
                                  if (serialInputRef.current) {
                                    serialInputRef.current.focus();
                                  }
                                  isSelectingFromDropdownRef.current = false;
                                }, 0);
                              }}
                            >
                              <div className="font-medium">{eq.num_serie}</div>
                              <div className="text-xs text-muted-foreground">{eq.nom_equipement}</div>
                              <div className="text-xs text-muted-foreground">Partition: {eq.partition}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedEquipmentId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleViewHistory(selectedEquipmentId)}
                        title="Voir l'historique de l'équipement"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {equipmentLoading && (
                  <p className="text-xs text-muted-foreground">Chargement des équipements...</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Commencez à taper le numéro de série pour voir les suggestions correspondantes
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_de_equipement">Nom de l'équipement *</Label>
                  <Select
                    value={formData.nom_de_equipement || ""}
                    onValueChange={(value) => {
                      // Clear any pending API calls that might override this change
                      if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                        fetchTimeoutRef.current = null;
                      }
                      equipmentNameManuallyChangedRef.current = true;
                      setFormData({ ...formData, nom_de_equipement: value });
                    }}
                    required
                    disabled={equipmentLoading}
                  >
                    <SelectTrigger className={formData.nom_de_equipement ? "bg-muted" : ""}>
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
                  {formData.nom_de_equipement && (
                    <p className="text-xs text-green-600">✓ Peut être modifié manuellement</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partition">Partition *</Label>
                  <Input
                    id="partition"
                    value={formData.partition || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, partition: e.target.value })
                    }
                    required
                    placeholder="Rempli automatiquement"
                    className={formData.partition ? "bg-muted" : ""}
                  />
                  {formData.partition && (
                    <p className="text-xs text-green-600">✓ Rempli automatiquement</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_type">Type de maintenance</Label>
                <Select
                  value={formData.maintenance_type || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, maintenance_type: value as 'preventive' | 'corrective' || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Préventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez l'incident en détail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anomalie_observee">Anomalie observée</Label>
                <Textarea
                  id="anomalie_observee"
                  placeholder="Décrivez l'anomalie observée..."
                  value={formData.anomalie_observee || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, anomalie_observee: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_realisee">Action réalisée</Label>
                <Textarea
                  id="action_realisee"
                  placeholder="Décrivez les actions réalisées..."
                  value={formData.action_realisee || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, action_realisee: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="piece_de_rechange_utilisee">Pièce de rechange utilisée</Label>
                <Input
                  id="piece_de_rechange_utilisee"
                  placeholder="Ex: Carte réseau, Disque dur..."
                  value={formData.piece_de_rechange_utilisee || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, piece_de_rechange_utilisee: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="etat_de_equipement_apres_intervention">État de l'équipement après intervention</Label>
                <Textarea
                  id="etat_de_equipement_apres_intervention"
                  placeholder="Décrivez l'état après intervention..."
                  value={formData.etat_de_equipement_apres_intervention || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, etat_de_equipement_apres_intervention: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendation">Recommandation</Label>
                <Textarea
                  id="recommendation"
                  placeholder="Recommandations pour éviter ce type d'incident..."
                  value={formData.recommendation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, recommendation: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duree_arret">Durée d'arrêt (en minutes)</Label>
                <Input
                  id="duree_arret"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ex: 120 pour 2 heures, 90 pour 1h30"
                  value={formData.duree_arret != null ? formData.duree_arret.toString() : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData({ ...formData, duree_arret: undefined });
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setFormData({ ...formData, duree_arret: numValue });
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Entrez la durée de panne en minutes (ex: 120 pour 2h, 90 pour 1h30)
                </p>
              </div>
            </>
          )}

          {type === "software" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="server">Server</Label>
                <Select
                  value={formData.server || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, server: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un serveur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radar">Radar</SelectItem>
                    <SelectItem value="FDP">FDP</SelectItem>
                    <SelectItem value="AGP">AGP</SelectItem>
                    <SelectItem value="SNMAP">SNMAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partition">Partition</Label>
                <Select
                  value={formData.partition || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, partition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CCR">CCR</SelectItem>
                    <SelectItem value="ALAP">ALAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type_d_anomalie">Type d'anomalie</Label>
                <Select
                  value={formData.type_d_anomalie || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type_d_anomalie: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="systematique">Systématique</SelectItem>
                    <SelectItem value="aleatoire">Aléatoire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom_radar">Nom radar</Label>
                <Select
                  value={formData.nom_radar || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, nom_radar: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un radar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OS">OS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="LO">LO</SelectItem>
                    <SelectItem value="BY">BY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
                <div className="space-y-2">
                <Label htmlFor="call_sign">Call Sign</Label>
                  <Input
                  id="call_sign"
                  value={formData.call_sign || ""}
                    onChange={(e) =>
                    setFormData({ ...formData, call_sign: e.target.value })
                    }
                  />
                </div>

              <div className="space-y-2">
                <Label htmlFor="FL">FL (ou altitude)</Label>
                <Input
                  id="FL"
                  value={formData.FL || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, FL: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code_SSR">Code SSR</Label>
                <Input
                  id="code_SSR"
                  value={formData.code_SSR || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, code_SSR: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sujet">Sujet</Label>
                <Input
                  id="sujet"
                  value={formData.sujet || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sujet: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez l'incident en détail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaires">Commentaires</Label>
                <Textarea
                  id="commentaires"
                  placeholder="Commentaires supplémentaires..."
                  value={formData.commentaires || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, commentaires: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            <Button type="submit" className="w-full" disabled={isSubmittingReport}>
              {isSubmittingReport ? "Enregistrement..." : "Enregistrer l'incident"}
          </Button>
          </div>

          {/* Report Form Section - always visible for software incidents */}
          {type === "software" && !initialData && (
            <div className="border-t pt-6 mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rapport d'analyse (optionnel)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Remplissez le rapport ci-dessous. Enregistrez d'abord l'incident, puis cliquez sur "Enregistrer le rapport".
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-anomaly">Anomalie observée</Label>
                  <Textarea
                    id="report-anomaly"
                    placeholder="Décrivez l'anomalie observée (sera pré-rempli depuis la description de l'incident si vide)..."
                    value={reportFormData.anomaly}
                    onChange={(e) =>
                      setReportFormData({ ...reportFormData, anomaly: e.target.value })
                    }
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si vide, sera automatiquement rempli avec la description de l'incident lors de l'enregistrement.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-analysis">Analyse</Label>
                  <Textarea
                    id="report-analysis"
                    placeholder="Analyse technique de l'incident..."
                    value={reportFormData.analysis}
                    onChange={(e) =>
                      setReportFormData({ ...reportFormData, analysis: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-conclusion">Conclusion</Label>
                  <Textarea
                    id="report-conclusion"
                    placeholder="Conclusion et recommandations..."
                    value={reportFormData.conclusion}
                    onChange={(e) =>
                      setReportFormData({ ...reportFormData, conclusion: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <Button
                  type="button"
                  onClick={async () => {
                    if (!lastCreatedIncidentId) {
                      toast.error("Veuillez d'abord enregistrer l'incident");
                      return;
                    }

                    const anomalyToSubmit = reportFormData.anomaly.trim() || formData.description || "";
                    
                    if (!anomalyToSubmit || !reportFormData.analysis.trim() || !reportFormData.conclusion.trim()) {
                      toast.error("Veuillez remplir tous les champs du rapport (Anomalie, Analyse, Conclusion)");
                      return;
                    }

                    try {
                      setIsSubmittingReport(true);
                      await addReport(lastCreatedIncidentId, {
                        anomaly: anomalyToSubmit,
                        analysis: reportFormData.analysis,
                        conclusion: reportFormData.conclusion,
                      });
                      toast.success("Rapport ajouté avec succès");
                      // Reset report form
                      setReportFormData({ anomaly: "", analysis: "", conclusion: "" });
                      setLastCreatedIncidentId(null);
                    } catch (error: any) {
                      toast.error(error.message || "Erreur lors de l'ajout du rapport");
                    } finally {
                      setIsSubmittingReport(false);
                    }
                  }}
                  disabled={isSubmittingReport || !lastCreatedIncidentId}
                  className="w-full"
                >
                  {isSubmittingReport ? "Enregistrement du rapport..." : "Enregistrer le rapport"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>

      {/* Equipment History Dialog */}
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
            <IncidentTable incidents={equipmentHistory} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
