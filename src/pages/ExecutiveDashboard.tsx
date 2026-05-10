import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Shield, ShieldAlert, Cpu, 
  BrainCircuit, Zap, BarChart3, TrendingUp,
  Clock, MapPin, RefreshCw, AlertTriangle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { apiClient } from "@/services/api";
import { cn } from "@/lib/utils";

// Components
import { AnimatedStatCard, RiskBadge } from "@/components/ai/DashboardWidgets";
import { ComplianceGauge, AIInsightCard, Insight } from "@/components/ai/InsightWidgets";
import { DetectionTimeline, TimelineEvent } from "@/components/ai/TimelineWidgets";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [ppeDistribution, setPpeDistribution] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [complianceTrend, setComplianceTrend] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summary, ins, ppe, comp, events] = await Promise.all([
        apiClient.getExecutiveSummary(),
        apiClient.getSafetyInsights(),
        apiClient.getPPEDistribution(),
        apiClient.getComplianceAnalytics(),
        apiClient.getDetectionEvents({ limit: 5 })
      ]);

      setData(summary);
      setInsights(ins);
      setPpeDistribution(ppe);
      setComplianceTrend(comp.trend);
      
      // Transform events to timeline format
      const formattedTimeline: TimelineEvent[] = events.results.map((e: any) => ({
        id: e.id,
        timestamp: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: e.compliance_status ? 'DETECTION' : 'VIOLATION',
        message: e.ai_summary || (e.compliance_status ? "Standard compliance scan completed." : "Personnel safety violation detected."),
        zone: e.zone_name || "Unknown Zone",
        risk: e.risk_score
      }));
      setTimeline(formattedTimeline);

    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full" 
          />
          <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center Offline</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Neural network data stream is currently unavailable. Please verify site connection.</p>
          <button 
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all"
          >
            Reconnect Stream
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Cinematic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <BrainCircuit className="h-40 w-40 text-blue-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
            />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">AI Network: Optimal</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">
            Safety Command Center
            <RefreshCw 
              onClick={fetchDashboardData}
              className={cn("h-6 w-6 text-slate-600 hover:text-blue-400 cursor-pointer transition-all", loading && "animate-spin")} 
            />
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl font-medium">
            Global vision intelligence and site-wide safety coordination. 
            Powered by Guardian Vision YOLOv8 Core Engine.
          </p>
        </div>

        <div className="flex items-center gap-6 relative z-10 bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Safety Status</p>
            <RiskBadge level={data?.risk_level || "LOW"} className="text-sm px-4 py-1.5" />
          </div>
          <div className="h-12 w-[1px] bg-slate-800" />
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">AI Confidence</p>
            <p className="text-2xl font-black text-white tracking-tighter">{data?.confidence_avg}%</p>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStatCard 
          title="Overall Compliance" 
          value={`${data?.compliance_rate}%`}
          icon={Shield}
          trend={{ value: "+2.4%", isUp: true }}
          color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          delay={0.1}
        />
        <AnimatedStatCard 
          title="Active Violations" 
          value={data?.total_violations}
          icon={ShieldAlert}
          trend={{ value: "-14%", isUp: true }}
          color="bg-red-500/10 border-red-500/20 text-red-400"
          delay={0.2}
        />
        <AnimatedStatCard 
          title="Monitored Zones" 
          value={data?.active_zones}
          icon={MapPin}
          color="bg-blue-500/10 border-blue-500/20 text-blue-400"
          delay={0.3}
        />
        <AnimatedStatCard 
          title="System Health" 
          value={`${data?.system_health}%`}
          icon={Cpu}
          color="bg-purple-500/10 border-purple-500/20 text-purple-400"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="h-32 w-32 text-emerald-500" />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                Compliance Velocity
              </h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Real-time safety performance trends</p>
            </div>
            <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-slate-500 uppercase">Forecast</span>
                <span className="text-sm font-black text-emerald-400">+{data?.compliance_forecast}%</span>
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '800' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Safety Score Gauge */}
        <div className="space-y-8">
          <ComplianceGauge value={data?.safety_score || 0} />
          
          {/* AI Safety Metrics List */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2.5rem] backdrop-blur-xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Neural Engine Stats</h4>
            <div className="space-y-5">
              {[
                { label: "Inference Success", value: "99.98%", color: "bg-emerald-500" },
                { label: "Processing Latency", value: "142ms", color: "bg-blue-500" },
                { label: "Neural Load", value: "34%", color: "bg-purple-500" },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">{stat.label}</span>
                    <span className="text-xs font-black text-white">{stat.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stat.value }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                      className={cn("h-full rounded-full", stat.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Insights Feed */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-purple-400" />
              Safety Insights
            </h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">v3.0 Engine</span>
          </div>
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <AIInsightCard key={i} insight={insight} delay={i * 0.15} />
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                Detection Feed
              </h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Real-time surveillance chronological log</p>
            </div>
            <button className="bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:border-slate-600 transition-all">
              View Full History
            </button>
          </div>
          <DetectionTimeline events={timeline} />
        </div>
      </div>

      {/* PPE Distribution & Risk Topology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
            Violation Taxonomy
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ppeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {ppeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-blue-600/5 blur-3xl opacity-50" />
           <div className="relative z-10 text-center space-y-6">
              <div className="h-20 w-20 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/20 mx-auto border border-white/20">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white tracking-tighter">Presentation Mode</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  Engage cinematic demonstration workflow for technical evaluation.
                </p>
              </div>
              <button className="h-14 w-full rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-2xl shadow-white/10">
                Initiate Live Demo
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
