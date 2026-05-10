import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Filter, Search, Clock, 
  MapPin, CheckCircle2, XCircle, Trash2,
  BellRing, Brain, Download
} from "lucide-react";
import { apiClient, SafetyViolation } from "@/services/api";
import { cn } from "@/lib/utils";

// Components
import { AlertCard } from "@/components/ai/SystemWidgets";

export default function AIAlertCenter() {
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<SafetyViolation[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [search, setSearch] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getViolations({ limit: 100 });
      setViolations(data.results);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const filteredViolations = violations.filter(v => {
    const matchesFilter = filter === 'ALL' || v.risk_level.toUpperCase() === filter;
    const matchesSearch = v.violation_type_display.toLowerCase().includes(search.toLowerCase()) || 
                          (v.zone_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: violations.length,
    critical: violations.filter(v => v.risk_level.toUpperCase() === 'CRITICAL').length,
    high: violations.filter(v => v.risk_level.toUpperCase() === 'HIGH').length,
    today: violations.filter(v => new Date(v.timestamp).toDateString() === new Date().toDateString()).length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
            <div className="h-12 w-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
              <BellRing className="h-7 w-7 text-white" />
            </div>
            AI Alert Center
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl font-medium">
            Centralized safety monitoring and incident prioritization. 
            Automated severity assessment by Guardian Neural Engine.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl border border-slate-700 transition-all font-bold text-xs uppercase tracking-widest shadow-xl">
            <Download className="h-4 w-4" />
            Export Log
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20">
            Archive All
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: stats.total, color: "text-blue-400" },
          { label: "Critical Priority", value: stats.critical, color: "text-red-500" },
          { label: "High Risk", value: stats.high, color: "text-orange-400" },
          { label: "New Today", value: stats.today, color: "text-emerald-400" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className={cn("text-3xl font-black tracking-tighter", s.color)}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2.5rem] backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by violation or zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0",
                filter === f 
                  ? "bg-white text-slate-950 border-white" 
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="h-32 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
             ))
          ) : filteredViolations.length > 0 ? (
            filteredViolations.map((v, i) => (
              <AlertCard 
                key={v.id}
                severity={v.risk_level.toUpperCase() as any}
                message={v.violation_type_display}
                zone={v.zone_name || "Unknown Zone"}
                timestamp={new Date(v.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                delay={i * 0.05}
              />
            ))
          ) : (
            <div className="col-span-2 py-32 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-20 w-20 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-slate-700" />
              </div>
              <div>
                <p className="text-xl font-black text-white uppercase tracking-widest">No Active Alerts</p>
                <p className="text-slate-500 text-sm mt-1">All monitored zones are currently compliant.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Intelligence Note */}
      <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="h-20 w-20 rounded-[2rem] bg-blue-600 flex items-center justify-center shrink-0 shadow-2xl shadow-blue-600/30">
          <Brain className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-xl font-black text-white tracking-tight">Predictive Alerting</h4>
          <p className="text-sm text-blue-200 leading-relaxed max-w-2xl font-medium">
            Guardian Vision AI cross-references historical data to identify early-warning patterns. 
            Critical alerts prioritized using our proprietary risk propagation algorithm.
          </p>
        </div>
      </div>
    </div>
  );
}
