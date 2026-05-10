import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// RiskBadge
// ─────────────────────────────────────────────────────────────────────────────
interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  className?: string;
}

export const RiskBadge = ({ level, className }: RiskBadgeProps) => {
  const styles: Record<string, string> = {
    LOW:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    MEDIUM:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    HIGH:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
    CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const currentStyle = styles[level.toUpperCase()] || styles.MEDIUM;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg",
        currentStyle,
        className
      )}
    >
      {level}
    </motion.span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedStatCard
// ─────────────────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  color: string;
  delay?: number;
}

export const AnimatedStatCard = ({ title, value, icon: Icon, trend, color, delay = 0 }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative group p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
      
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl border", color)}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border",
            trend.isUp ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            {trend.value}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="text-3xl font-black text-white tracking-tighter"
        >
          {value}
        </motion.h3>
      </div>

      {/* Decorative pulse */}
      <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500/20 animate-ping" />
    </motion.div>
  );
};
