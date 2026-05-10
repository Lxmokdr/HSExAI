import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock, MapPin, Brain, ShieldAlert, Cpu } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// AlertCard
// ─────────────────────────────────────────────────────────────────────────────
interface AlertProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  zone: string;
  timestamp: string;
  delay?: number;
}

export const AlertCard = forwardRef<HTMLDivElement, AlertProps>(({ severity, message, zone, timestamp, delay = 0 }, ref) => {
  const themes = {
    CRITICAL: "border-red-500/50 bg-red-500/10 text-red-100",
    HIGH:     "border-orange-500/40 bg-orange-500/10 text-orange-100",
    MEDIUM:   "border-yellow-500/30 bg-yellow-500/5 text-yellow-100",
    LOW:      "border-blue-500/20 bg-blue-500/5 text-blue-100",
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "relative flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-md shadow-xl overflow-hidden",
        themes[severity]
      )}
    >
      {severity === 'CRITICAL' && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-red-500/20 pointer-events-none" 
        />
      )}

      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0",
        severity === 'CRITICAL' ? "bg-red-500/20 border-red-500/30" : "bg-slate-800 border-slate-700"
      )}>
        <ShieldAlert className={cn("h-5 w-5", severity === 'CRITICAL' ? "text-red-500" : "text-slate-400")} />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
            themes[severity]
          )}>
            {severity} ALERT
          </span>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
            <Clock className="h-3 w-3" />
            {timestamp}
          </div>
        </div>
        <p className="text-sm font-bold leading-relaxed">{message}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-tighter">
          <MapPin className="h-3 w-3" />
          {zone}
        </div>
      </div>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// AIProcessingLoader
// ─────────────────────────────────────────────────────────────────────────────
export const AIProcessingLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-8 text-center">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="h-32 w-32 rounded-full border-4 border-slate-800 border-t-blue-500 shadow-2xl shadow-blue-500/20"
        />
        {/* Inner pulsing core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="h-16 w-16 rounded-3xl bg-blue-600 flex items-center justify-center border border-white/20 shadow-xl"
          >
            <Cpu className="h-8 w-8 text-white" />
          </motion.div>
        </div>
      </div>

      <div className="space-y-2">
        <motion.h3 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-xl font-black text-white uppercase tracking-widest"
        >
          Engaging Neural Engine
        </motion.h3>
        <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-tighter justify-center">
          <Brain className="h-4 w-4 animate-bounce" />
          Inference in progress...
        </div>
      </div>

      <div className="w-64 space-y-1">
        <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
          <span>YOLOv8 Core</span>
          <span>GPU Accelerated</span>
        </div>
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-blue-500 w-full"
          />
        </div>
      </div>
    </div>
  );
};
