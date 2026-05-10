import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BrainCircuit, Zap, AlertTriangle, ShieldCheck, Info } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ComplianceGauge
// ─────────────────────────────────────────────────────────────────────────────
export const ComplianceGauge = ({ value, label = "Safety Score" }: { value: number; label?: string }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-slate-950/40 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl">
      <svg className="w-48 h-48 transform -rotate-90">
        {/* Background track */}
        <circle
          cx="96" cy="96" r={radius}
          stroke="currentColor" strokeWidth="12" fill="transparent"
          className="text-slate-800"
        />
        {/* Progress path */}
        <motion.circle
          cx="96" cy="96" r={radius}
          stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: "circOut" }}
          strokeLinecap="round"
          className={cn(
            value > 90 ? "text-emerald-500" : value > 75 ? "text-blue-500" : value > 60 ? "text-orange-500" : "text-red-500"
          )}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-black text-white tracking-tighter"
        >
          {value}%
        </motion.span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>

      {/* Decorative inner glow */}
      <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AIInsightCard
// ─────────────────────────────────────────────────────────────────────────────
export interface Insight {
  type: 'warning' | 'critical' | 'alert' | 'positive';
  message: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const AIInsightCard = ({ insight, delay = 0 }: { insight: Insight; delay?: number }) => {
  const icons = {
    warning:  <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    critical: <Zap className="h-5 w-5 text-red-500" />,
    alert:    <Info className="h-5 w-5 text-blue-400" />,
    positive: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
  };

  const colors = {
    warning:  "border-yellow-500/20 bg-yellow-500/5",
    critical: "border-red-500/20 bg-red-500/5",
    alert:    "border-blue-500/20 bg-blue-500/5",
    positive: "border-emerald-500/20 bg-emerald-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "group relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02]",
        colors[insight.type]
      )}
    >
      <div className="flex gap-4">
        <div className="shrink-0 mt-1">{icons[insight.type]}</div>
        <div className="space-y-1">
          <p className="text-sm text-slate-200 font-medium leading-relaxed">{insight.message}</p>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact Analysis</span>
            <span className={cn(
              "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
              insight.impact === 'CRITICAL' ? "text-red-400 border-red-500/30" : 
              insight.impact === 'HIGH' ? "text-orange-400 border-orange-500/30" : "text-slate-400 border-slate-700"
            )}>
              {insight.impact}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
        <BrainCircuit className="h-10 w-10 text-white" />
      </div>
    </motion.div>
  );
};
