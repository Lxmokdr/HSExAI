import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ShieldCheck, ShieldAlert, Plus, 
  Settings2, Activity, MoreVertical, LayoutGrid,
  HardHat, UserCheck, Shield, Thermometer,
  Eye, EyeOff, Search, Footprints, Glasses
} from "lucide-react";
import { apiClient, Zone } from "@/services/api";
import { cn } from "@/lib/utils";

// Components
import { RiskBadge } from "@/components/ai/DashboardWidgets";

const PPE_ICONS: Record<string, any> = {
  helmet: <HardHat className="h-4 w-4" />,
  vest: <Shield className="h-4 w-4" />,
  gloves: <UserCheck className="h-4 w-4" />,
  mask: <Thermometer className="h-4 w-4" />,
  shoes: <Footprints className="h-4 w-4" />,
  glasses: <Glasses className="h-4 w-4" />,
};

export default function ZoneOverview() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getZones();
      setZones(data?.results || []);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const filteredZones = (zones || []).filter(z => 
    z?.name?.toLowerCase().includes(search.toLowerCase()) || 
    z?.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <LayoutGrid className="h-7 w-7 text-white" />
            </div>
            Zone Visualization
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl font-medium">
            Area monitoring and compliance rule orchestration. 
            Define safety parameters for disparate industrial sectors.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search zones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95">
            <Plus className="h-4 w-4" />
            New Zone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[400px] rounded-[2.5rem] bg-slate-900/40 animate-pulse border border-slate-800" />
            ))
          ) : filteredZones.map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] backdrop-blur-xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 shadow-2xl"
            >
              {/* Card Header Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-50" />
              
              <div className="relative p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <MapPin className="h-4 w-4 text-emerald-500" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{zone.location}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">{zone.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {zone.is_active ? (
                      <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl border border-emerald-500/20">
                         <Activity className="h-5 w-5 animate-pulse" />
                      </div>
                    ) : (
                      <div className="bg-slate-800 text-slate-500 p-2 rounded-xl border border-slate-700">
                         <EyeOff className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Rate</p>
                      <p className="text-xl font-black text-white">{zone.compliance_threshold}%</p>
                   </div>
                   <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Assessed Risk</p>
                      <RiskBadge level={zone.risk_category} />
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-blue-500" />
                     Safety Requirements
                   </h4>
                   <div className="flex flex-wrap gap-2">
                      {zone.required_ppe_rules?.length > 0 ? (
                        zone.required_ppe_rules.map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 uppercase">
                             {PPE_ICONS[rule.toLowerCase()] || <Shield className="h-3 w-3" />}
                             {rule}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs italic text-slate-600">No specific rules defined</span>
                      )}
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase">Status</span>
                      <span className={cn(
                        "text-xs font-black uppercase tracking-tighter",
                        zone.is_active ? "text-emerald-400" : "text-slate-500"
                      )}>
                        {zone.is_active ? "Actively Monitoring" : "Inactive Sector"}
                      </span>
                   </div>
                   <button className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                      <Settings2 className="h-5 w-5" />
                   </button>
                </div>
              </div>

              {/* Action Hover */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-emerald-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex items-center justify-center">
                 <button className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                   View Sector Details <Activity className="h-4 w-4" />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Industrial Map Mock */}
      <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[3rem] backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center text-center gap-6 shadow-2xl">
         <div className="absolute inset-0 bg-emerald-500/5 blur-3xl" />
         <div className="h-24 w-24 rounded-[2.5rem] bg-emerald-600/20 border-2 border-emerald-500/30 flex items-center justify-center relative">
            <LayoutGrid className="h-10 w-10 text-emerald-500" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] pointer-events-none" 
            />
         </div>
         <div className="space-y-2 relative z-10">
            <h3 className="text-3xl font-black text-white tracking-tighter">Interactive Facility Map</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto font-medium">
              Geospatial visualization of your entire industrial complex. 
              Real-time heatmaps and risk distribution overlay.
            </p>
         </div>
         <button className="h-14 px-12 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-2xl shadow-white/10 relative z-10">
            Activate Visual Map
         </button>
      </div>
    </div>
  );
}
