import { useState, useMemo } from "react";
import { AlertTriangle, Cpu, HardDrive, Clock, TrendingUp, Calendar, Server } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIncidents } from "@/hooks/useIncidents";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type PeriodType = 'week' | 'month' | 'year';

// Chart colors
const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const { hardwareIncidents, softwareIncidents, stats } = useIncidents();
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  // Constants
  const currentYear = new Date().getFullYear();
  const isCurrentYear = selectedYear === currentYear;

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get week number of the year (ISO week) for period grouping
   */
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  /**
   * Get Monday of the week for a given date
   */
  const getMondayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  /**
   * Get week number of the month (1-4)
   */
  const getWeekOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay() || 7;
    const dayOfMonth = date.getDate();
    return Math.min(Math.ceil((dayOfMonth + firstDayOfWeek - 1) / 7), 4);
  };

  /**
   * Get period key from date based on period type
   */
  const getPeriodKey = (date: Date, period: PeriodType): string => {
    if (period === 'week') {
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      const monday = getMondayOfWeek(date);
      const month = monday.toLocaleDateString('fr-FR', { month: 'short' });
      return `${year}-S${week.toString().padStart(2, '0')} (${month})`;
    } else if (period === 'month') {
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  };

  /**
   * Normalize anomaly type to standard values
   */
  const normalizeAnomalyType = (type: string | undefined): string => {
    if (!type) return 'Non spécifié';
    const normalized = type.toLowerCase().trim();
    if (normalized === 'systeme' || normalized === 'systématique' || normalized === 'systematique') {
      return 'Systématique';
    }
    if (normalized === 'aleatoire' || normalized === 'aléatoire') {
      return 'Aléatoire';
    }
    return type;
  };

  /**
   * Get incident date from incident object
   */
  const getIncidentDate = (incident: { date?: string; created_at?: string }): Date => {
    return new Date(incident.date || incident.created_at || Date.now());
  };

  /**
   * Check if incident matches period filters
   */
  const matchesPeriodFilter = (incidentDate: Date): boolean => {
    const incidentYear = incidentDate.getFullYear();
    const incidentMonth = incidentDate.getMonth() + 1;
    
    if (incidentYear !== selectedYear) return false;
    if (selectedMonth !== null && incidentMonth !== selectedMonth) return false;
    if (selectedWeek !== null && selectedMonth !== null) {
      const incidentWeekOfMonth = getWeekOfMonth(incidentDate);
      if (incidentWeekOfMonth !== selectedWeek) return false;
    }
    return true;
  };

  /**
   * Aggregate incidents by a key field
   */
  const aggregateByKey = <T extends { [key: string]: any }>(
    incidents: T[],
    keyExtractor: (incident: T) => string
  ): Array<{ name: string; value: number }> => {
    const map: Record<string, number> = {};
    incidents.forEach(incident => {
      const key = keyExtractor(incident) || 'Non spécifié';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  };

  /**
   * Format period title for display
   */
  const formatPeriodTitle = (): string => {
    if (selectedMonth !== null) {
      const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return selectedWeek !== null ? ` - ${monthName} - Semaine ${selectedWeek}` : ` - ${monthName}`;
    }
    return ` - ${selectedYear}`;
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value);
    setSelectedYear(newYear);
    setSelectedMonth(null);
    setSelectedWeek(null);
  };

  const handleMonthChange = (value: string) => {
    const newMonth = value === "all" ? null : parseInt(value);
    setSelectedMonth(newMonth);
    if (newMonth === null) {
      setSelectedWeek(null);
    } else if (selectedWeek !== null && selectedWeek > 4) {
      setSelectedWeek(null);
    }
  };

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value === "all" ? null : parseInt(value));
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Available years from incidents
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    [...hardwareIncidents, ...softwareIncidents].forEach(incident => {
      const date = getIncidentDate(incident);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [hardwareIncidents, softwareIncidents]);

  // Available weeks for selected month (1-4)
  const availableWeeks = useMemo(() => {
    if (selectedMonth === null) {
      return [];
    }
    return [1, 2, 3, 4];
  }, [selectedMonth]);

  // Effective period type based on selections
  const effectivePeriodType = useMemo(() => {
    if (selectedWeek !== null) return 'week';
    if (selectedMonth !== null) return 'month';
    return 'year';
  }, [selectedWeek, selectedMonth]);

  // ============================================================================
  // Filtered Data
  // ============================================================================

  const filteredHardwareIncidents = useMemo(() => {
    return hardwareIncidents.filter(incident => {
      const incidentDate = getIncidentDate(incident);
      if (!matchesPeriodFilter(incidentDate)) return false;
      if (!isCurrentYear && incident.maintenance_type !== 'corrective') return false;
      return true;
    });
  }, [hardwareIncidents, selectedYear, selectedMonth, selectedWeek, isCurrentYear]);
  
  const filteredSoftwareIncidents = useMemo(() => {
    return softwareIncidents.filter(incident => {
      const incidentDate = getIncidentDate(incident);
      return matchesPeriodFilter(incidentDate);
    });
  }, [softwareIncidents, selectedYear, selectedMonth, selectedWeek]);

  // ============================================================================
  // Statistics
  // ============================================================================

  const incidentsWithDowntime = useMemo(() => {
    return filteredHardwareIncidents.filter(i => i.duree_arret && i.duree_arret > 0);
  }, [filteredHardwareIncidents]);
  
  const hardwareServerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredHardwareIncidents.forEach(inc => {
      const server = inc.partition || 'Non spécifié';
      stats[server] = (stats[server] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredHardwareIncidents]);

  const softwareServerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredSoftwareIncidents.forEach(inc => {
      if (inc.server) {
        stats[inc.server] = (stats[inc.server] || 0) + 1;
      }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredSoftwareIncidents]);

  const maintenanceTypeStats = useMemo(() => {
    const stats = { preventive: 0, corrective: 0 };
    filteredHardwareIncidents.forEach(inc => {
      if (inc.maintenance_type === 'preventive') {
        stats.preventive++;
      } else if (inc.maintenance_type === 'corrective') {
        stats.corrective++;
      }
    });
    return stats;
  }, [filteredHardwareIncidents]);
  
  // ============================================================================
  // Chart Data
  // ============================================================================

  // Incidents by day (last 30 days)
  const incidentsByDay = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: dateStr,
        day: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        hardware: 0,
        software: 0,
        total: 0
      };
    });

    const addIncidentToDay = (incident: { date?: string; created_at?: string }, type: 'hardware' | 'software') => {
      const incidentDate = incident.date || incident.created_at?.split('T')[0];
      if (incidentDate) {
        const dayData = last30Days.find(d => d.date === incidentDate);
        if (dayData) {
          dayData[type]++;
          dayData.total++;
        }
      }
    };

    filteredHardwareIncidents.forEach(incident => addIncidentToDay(incident, 'hardware'));
    filteredSoftwareIncidents.forEach(incident => addIncidentToDay(incident, 'software'));

    return last30Days;
  }, [filteredHardwareIncidents, filteredSoftwareIncidents]);

  // Hardware incidents by equipment
  const hardwareIncidentsByEquipmentForPeriod = useMemo(() => {
    return aggregateByKey(filteredHardwareIncidents, inc => inc.nom_de_equipement || '');
  }, [filteredHardwareIncidents]);

  // Software incidents by server
  const softwareIncidentsByServerForPeriod = useMemo(() => {
    return aggregateByKey(filteredSoftwareIncidents, inc => inc.server || '');
  }, [filteredSoftwareIncidents]);

  // Downtime by equipment
  const downtimeByEquipment = useMemo(() => {
    const equipmentMap: Record<string, number> = {};
    
    filteredHardwareIncidents.forEach(incident => {
      if (incident.duree_arret && incident.duree_arret > 0) {
        const equipmentName = incident.nom_de_equipement || 'Non spécifié';
        equipmentMap[equipmentName] = (equipmentMap[equipmentName] || 0) + incident.duree_arret;
      }
    });

    return Object.entries(equipmentMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, minutes]) => ({ 
        name, 
        minutes,
        hours: Math.floor(minutes / 60),
        mins: minutes % 60,
        display: `${Math.floor(minutes / 60)}h ${minutes % 60}min`
      }));
  }, [filteredHardwareIncidents]);

  // Software incidents by anomaly type
  const softwareIncidentsByAnomaly = useMemo(() => {
    const anomalyMap: Record<string, Record<string, number>> = {};
    
    filteredSoftwareIncidents.forEach(incident => {
      const anomalyType = normalizeAnomalyType(incident.type_d_anomalie);
      const incidentDate = getIncidentDate(incident);
      const periodKey = getPeriodKey(incidentDate, effectivePeriodType);
      
      if (!anomalyMap[anomalyType]) {
        anomalyMap[anomalyType] = {};
      }
      
      anomalyMap[anomalyType][periodKey] = (anomalyMap[anomalyType][periodKey] || 0) + 1;
    });

    // Filter to only show Systématique and Aléatoire
    const allowedTypes = ['Systématique', 'Aléatoire'];
    const filteredAnomalyMap: Record<string, Record<string, number>> = {};
    allowedTypes.forEach(type => {
      if (anomalyMap[type]) {
        filteredAnomalyMap[type] = anomalyMap[type];
      } else {
        filteredAnomalyMap[type] = {};
      }
    });

    // Get all unique periods
    const allPeriods = new Set<string>();
    Object.values(filteredAnomalyMap).forEach(periodData => {
      Object.keys(periodData).forEach(period => allPeriods.add(period));
    });
    const sortedPeriods = Array.from(allPeriods).sort();

    // Transform to chart data format
    const chartData = sortedPeriods.map(period => {
      const data: Record<string, any> = { period };
      allowedTypes.forEach(anomalyType => {
        data[anomalyType] = filteredAnomalyMap[anomalyType][period] || 0;
      });
      return data;
    });

    return {
      chartData,
      anomalyTypes: allowedTypes,
      anomalyCounts: allowedTypes.map(type => ({
        type,
        total: Object.values(filteredAnomalyMap[type] || {}).reduce((sum, count) => sum + count, 0)
      })).sort((a, b) => b.total - a.total)
    };
  }, [filteredSoftwareIncidents, effectivePeriodType]);

  // Corrective incidents comparison across years (using ALL incidents, not filtered)
  const correctiveIncidentsByYear = useMemo(() => {
    const yearMap: Record<number, number> = {};
    
    hardwareIncidents
      .filter(incident => incident.maintenance_type === 'corrective')
      .forEach(incident => {
        const year = getIncidentDate(incident).getFullYear();
        yearMap[year] = (yearMap[year] || 0) + 1;
      });

    return Object.entries(yearMap)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [hardwareIncidents]);

  // Corrective incidents comparison across servers (using ALL incidents, not filtered)
  const correctiveIncidentsByServer = useMemo(() => {
    const serverMap: Record<string, number> = {};
    
    hardwareIncidents
      .filter(incident => incident.maintenance_type === 'corrective')
      .forEach(incident => {
        const server = incident.partition || 'Non spécifié';
        serverMap[server] = (serverMap[server] || 0) + 1;
      });

    return Object.entries(serverMap)
      .map(([server, count]) => ({ server, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [hardwareIncidents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Vue d'ensemble complète des incidents techniques et statistiques
        </p>
      </div>

      {/* Hardware Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            Incidents Matériels
          </h2>
        </div>

        {/* Hardware Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Incidents Matériels"
            value={filteredHardwareIncidents.length}
            icon={Cpu}
            variant="accent"
            trend={!isCurrentYear ? "Uniquement maintenance corrective" : undefined}
          />
          <StatCard
            title="Incidents avec arrêt"
            value={stats?.hardware_incidents_with_downtime || incidentsWithDowntime.length}
            icon={AlertTriangle}
            variant="primary"
            trend={stats?.hardware_downtime_percentage !== undefined 
              ? `${stats.hardware_downtime_percentage}% des incidents matériels` 
              : hardwareIncidents.length > 0
                ? `${Math.round((incidentsWithDowntime.length / hardwareIncidents.length) * 100)}% des incidents`
                : undefined}
          />
        </div>

        {/* Hardware Secondary Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="30 derniers jours"
            value={stats?.hardware_last_30_days || 0}
            icon={Calendar}
            variant="accent"
          />
          {isCurrentYear && (
            <StatCard
              title="Maintenance Préventive"
              value={maintenanceTypeStats.preventive}
              icon={TrendingUp}
              variant="accent"
              trend={`${filteredHardwareIncidents.length > 0 ? Math.round((maintenanceTypeStats.preventive / filteredHardwareIncidents.length) * 100) : 0}% des incidents matériels`}
            />
          )}
          <StatCard
            title="Maintenance Corrective"
            value={maintenanceTypeStats.corrective}
            icon={AlertTriangle}
            variant="warning"
            trend={`${filteredHardwareIncidents.length > 0 ? Math.round((maintenanceTypeStats.corrective / filteredHardwareIncidents.length) * 100) : 0}% des incidents matériels`}
          />
        </div>
      </div>

      {/* Software Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            Incidents Logiciels
          </h2>
        </div>

        {/* Software Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Incidents Logiciels"
            value={filteredSoftwareIncidents.length}
            icon={HardDrive}
            variant="warning"
          />
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Période d'analyse
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="year-select" className="text-sm">Année:</Label>
                <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger id="year-select" className="w-[150px]">
                    <SelectValue placeholder="Année..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year} {year === currentYear ? '(actuelle)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="month-select" className="text-sm">Mois:</Label>
                <Select value={selectedMonth?.toString() || "all"} onValueChange={handleMonthChange}>
                  <SelectTrigger id="month-select" className="w-[150px]">
                    <SelectValue placeholder="Tous les mois..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const date = new Date(selectedYear, month - 1, 1);
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {date.toLocaleDateString('fr-FR', { month: 'long' })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedMonth !== null && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="week-select" className="text-sm">Semaine:</Label>
                  <Select value={selectedWeek?.toString() || "all"} onValueChange={handleWeekChange}>
                    <SelectTrigger id="week-select" className="w-[150px]">
                      <SelectValue placeholder="Toutes les semaines..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les semaines</SelectItem>
                      {availableWeeks.map(week => (
                        <SelectItem key={week} value={week.toString()}>
                          Semaine {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          {!isCurrentYear && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium">Note:</span> Pour les années précédentes, seuls les incidents de maintenance corrective sont affichés pour les incidents matériels.
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Hardware Incidents by Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Incidents Matériels par équipement{formatPeriodTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(450, hardwareIncidentsByEquipmentForPeriod.length * 40)}>
            <BarChart data={hardwareIncidentsByEquipmentForPeriod} layout="vertical" margin={{ left: 10, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={300}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Nombre d'incidents" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Downtime by Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Répartition du temps d'arrêt par équipement{formatPeriodTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downtimeByEquipment.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(450, downtimeByEquipment.length * 40)}>
              <BarChart data={downtimeByEquipment} layout="vertical" margin={{ left: 10, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  label={{ value: 'Minutes', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={300}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip 
                  formatter={(value: number) => {
                    const hours = Math.floor(value / 60);
                    const mins = value % 60;
                    return `${hours}h ${mins}min`;
                  }}
                />
                <Legend />
                <Bar dataKey="minutes" fill="#ef4444" name="Temps d'arrêt" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun temps d'arrêt enregistré pour la période sélectionnée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Software Incidents by Server */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Incidents Logiciels par serveur{formatPeriodTitle()}
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="year-select-software" className="text-sm">Année:</Label>
                <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger id="year-select-software" className="w-[150px]">
                    <SelectValue placeholder="Année..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year} {year === currentYear ? '(actuelle)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="month-select-software" className="text-sm">Mois:</Label>
                <Select value={selectedMonth?.toString() || "all"} onValueChange={handleMonthChange}>
                  <SelectTrigger id="month-select-software" className="w-[150px]">
                    <SelectValue placeholder="Tous les mois..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const date = new Date(selectedYear, month - 1, 1);
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {date.toLocaleDateString('fr-FR', { month: 'long' })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedMonth !== null && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="week-select-software" className="text-sm">Semaine:</Label>
                  <Select value={selectedWeek?.toString() || "all"} onValueChange={handleWeekChange}>
                    <SelectTrigger id="week-select-software" className="w-[150px]">
                      <SelectValue placeholder="Toutes les semaines..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les semaines</SelectItem>
                      {availableWeeks.map(week => (
                        <SelectItem key={week} value={week.toString()}>
                          Semaine {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(450, softwareIncidentsByServerForPeriod.length * 40)}>
            <BarChart data={softwareIncidentsByServerForPeriod} layout="vertical" margin={{ left: 10, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={300}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#f59e0b" name="Nombre d'incidents" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hardware Charts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Cpu className="h-6 w-6" />
          Graphiques - Matériel
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Hardware Incidents Over Time - Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution des incidents matériels (30 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={incidentsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="hardware" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Matériel"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Software Incidents by Anomaly Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Incidents logiciels par type d'anomalie ({effectivePeriodType === 'week' ? 'par semaine' : effectivePeriodType === 'month' ? 'par mois' : 'par année'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {softwareIncidentsByAnomaly.anomalyTypes.length > 0 ? (
            <div className="space-y-6">
              {/* Stacked Bar Chart */}
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={softwareIncidentsByAnomaly.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {softwareIncidentsByAnomaly.anomalyTypes.map((anomalyType, index) => (
                    <Bar 
                      key={anomalyType}
                      dataKey={anomalyType} 
                      stackId="a"
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      name={anomalyType}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              
              {/* Summary Table */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Résumé par type d'anomalie</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {softwareIncidentsByAnomaly.anomalyCounts.map((item) => (
                    <div key={item.type} className="text-center p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-2xl font-bold">{item.total}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun incident logiciel avec type d'anomalie enregistré
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparison Charts for Corrective Incidents */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Comparaisons - Maintenance Corrective
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Corrective Incidents by Year */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Incidents Correctifs par Année
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={correctiveIncidentsByYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Année', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: "Nombre d'incidents", angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ef4444" name="Incidents Correctifs" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Corrective Incidents by Server */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Incidents Correctifs par Serveur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={correctiveIncidentsByServer} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="server" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ef4444" name="Incidents Correctifs" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hardware Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Statistiques Matériel - Répartition par Serveur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hardwareServerStats.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Répartition par serveur</h4>
                <div className="grid grid-cols-2 gap-2">
                  {hardwareServerStats.slice(0, 6).map(([server, count]) => (
                    <div key={server} className="text-center p-2 rounded-lg border border-border bg-muted/30">
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{server}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Software Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Statistiques Logiciel - Répartition par Serveur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {softwareServerStats.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Répartition par serveur</h4>
                <div className="grid grid-cols-2 gap-2">
                  {softwareServerStats.slice(0, 6).map(([server, count]) => (
                    <div key={server} className="text-center p-2 rounded-lg border border-border bg-muted/30">
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{server}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
