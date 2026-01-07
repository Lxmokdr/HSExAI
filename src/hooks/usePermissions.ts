import { useMemo } from 'react';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canAccessHardwareIncidents: false,
        canAccessSoftwareIncidents: false,
        canAccessEquipment: false,
        canAccessReports: false,
        canAccessDashboards: false,
        canModifyHardwareIncidents: false,
        canModifySoftwareIncidents: false,
        canModifyEquipment: false,
        canModifyReports: false,
        isReadOnly: false,
        isSuperadmin: false,
      };
    }

    const role = user.role;
    const isSuperadmin = role === 'superadmin';
    const isChefDepartement = role === 'chef_departement';
    const isServiceMaintenance = role === 'service_maintenance';
    const isServiceIntegration = role === 'service_integration';

    return {
      canAccessHardwareIncidents: isServiceMaintenance || isChefDepartement || isSuperadmin,
      canAccessSoftwareIncidents: isServiceIntegration || isChefDepartement || isSuperadmin,
      canAccessEquipment: isServiceMaintenance || isChefDepartement || isSuperadmin,
      canAccessReports: isServiceIntegration || isChefDepartement || isSuperadmin,
      canAccessDashboards: isChefDepartement || isSuperadmin,
      canModifyHardwareIncidents: isServiceMaintenance || isSuperadmin,
      canModifySoftwareIncidents: isServiceIntegration || isServiceMaintenance || isSuperadmin,
      canModifyEquipment: isServiceMaintenance || isSuperadmin,
      canModifyReports: isServiceIntegration || isSuperadmin,
      isReadOnly: isChefDepartement,
      isSuperadmin,
    };
  }, [user]);

  return permissions;
}
