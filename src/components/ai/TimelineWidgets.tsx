import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, ShieldCheck, ShieldAlert, Zap, Search } from "lucide-react";
import { RiskBadge } from "./DashboardWidgets";

export interface TimelineEvent {
  id: number;
  timestamp: string;
  type: 'DETECTION' | 'VIOLATION' | 'SYSTEM';
  message: string;
  zone: string;
  risk: string;
}

export const DetectionTimeline = ({ events }: { events: TimelineEvent[] }) => {
  return (
    <div className="space-y-6 relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-500/50 via-slate-800 to-slate-900" />

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
          <Search className="h-10 w-10 mb-2" />
          <p className="text-xs font-black uppercase tracking-widest">No activity recorded</p>
        </div>
      ) : (
        events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative flex gap-6 group"
          >
            {/* Icon marker */}
            <div className={cn(
              "relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 backdrop-blur-xl shadow-lg transition-transform duration-300 group-hover:scale-110",
              event.type === 'VIOLATION' ? "bg-red-500/20 border-red-500/40 text-red-400" :
              event.type === 'DETECTION' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
              "bg-slate-800 border-slate-700 text-slate-400"
            )}>
              {event.type === 'VIOLATION' ? <ShieldAlert className="h-5 w-5" /> : 
               event.type === 'DETECTION' ? <ShieldCheck className="h-5 w-5" /> : 
               <Zap className="h-5 w-5" />}
            </div>

            {/* Content card */}
            <div className="flex-1 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all duration-300 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{event.type}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-700" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{event.zone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
                  <Clock className="h-3 w-3" />
                  {event.timestamp}
                </div>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-bold text-slate-200 leading-snug">{event.message}</p>
                {event.risk !== 'NONE' && (
                  <RiskBadge level={event.risk} className="shrink-0" />
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};
