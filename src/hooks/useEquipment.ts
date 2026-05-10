import { useState, useEffect } from "react";
import { apiClient, Equipment } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function useEquipment() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load equipment on mount (only if authenticated)
  useEffect(() => {
    // Wait for auth to finish loading, then check if authenticated
    if (!authLoading && isAuthenticated) {
      loadEquipment();
    } else if (!authLoading && !isAuthenticated) {
      // Not authenticated, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getEquipment() as any;
      setEquipment(response.results || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des équipements");
      console.error("Error loading equipment:", err);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const addEquipment = async (data: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newEquipment = await apiClient.createEquipment(data);
      await loadEquipment();
      return newEquipment;
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'équipement");
      throw err;
    }
  };

  const updateEquipment = async (id: number, data: Partial<Equipment>) => {
    try {
      const updatedEquipment = await apiClient.updateEquipment(id, data);
      setEquipment(prev => prev.map(e => e.id === id ? updatedEquipment : e));
      return updatedEquipment;
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de l'équipement");
      throw err;
    }
  };

  const deleteEquipment = async (id: number) => {
    try {
      await apiClient.deleteEquipment(id);
      setEquipment(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression de l'équipement");
      throw err;
    }
  };

  const refreshEquipment = () => {
    loadEquipment();
  };

  return {
    equipment,
    loading,
    error,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refreshEquipment,
  };
}

