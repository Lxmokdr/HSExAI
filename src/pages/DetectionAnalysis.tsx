import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Brain, ShieldAlert, CheckCircle2,
  Search, Maximize2, Zap, Cpu, History,
  Eye, EyeOff, ShieldCheck, Info, AlertTriangle, Clock
} from "lucide-react";
import { apiClient, DetectionEvent } from "@/services/api";
import { cn } from "@/lib/utils";

// Components
import { AIProcessingLoader } from "@/components/ai/SystemWidgets";
import { RiskBadge } from "@/components/ai/DashboardWidgets";

export default function DetectionAnalysis() {
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<DetectionEvent | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE = "http://localhost:8000";

  const resolveMediaUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setEvent(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Small delay for cinematic effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      const res = await apiClient.detectImage(formData);
      setEvent(res);
    } catch (err) {
      console.error("Detection failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Search className="h-7 w-7 text-white" />
            </div>
            AI Inspection Suite
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl font-medium">
            Advanced vision analysis platform. Upload surveillance frames for
            deep-learning based safety compliance auditing.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Upload className="h-4 w-4" />
            Analyze New Frame
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>

      {!preview && !loading ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-[60vh] rounded-[3rem] border-4 border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
          <div className="h-24 w-24 rounded-[2.5rem] bg-slate-800 flex items-center justify-center border-2 border-slate-700 group-hover:bg-blue-600 group-hover:border-blue-400 transition-all duration-500 shadow-2xl">
            <Upload className="h-10 w-10 text-slate-500 group-hover:text-white" />
          </div>
          <div className="text-center space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tight">Select Site Imagery</h3>
            <p className="text-slate-500 font-medium max-w-xs uppercase text-[10px] tracking-widest">Supports JPG, PNG, WEBP (Max 20MB)</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Inspection Viewport */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-[2.5rem] border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl group min-h-[500px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <AIProcessingLoader />
                  </motion.div>
                ) : (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <img 
                      src={showOriginal ? preview! : (resolveMediaUrl(event?.annotated_image_url) || preview!)} 
                      alt="AI Analysis"
                      className="max-h-[70vh] w-auto object-contain transition-all duration-700"
                    />

                    {/* Floating Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-2 rounded-2xl shadow-2xl">
                      <button
                        onClick={() => setShowOriginal(false)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          !showOriginal ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:text-white"
                        )}
                      >
                        AI Layer
                      </button>
                      <button
                        onClick={() => setShowOriginal(true)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          showOriginal ? "bg-white text-slate-950 shadow-lg" : "text-slate-400 hover:text-white"
                        )}
                      >
                        Original
                      </button>
                    </div>

                    <button className="absolute top-6 right-6 h-12 w-12 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl">
                      <Maximize2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Neural Summary Panel */}
            <AnimatePresence>
              {event && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                      <Brain className="h-6 w-6 text-purple-400" />
                      AI Explanation Layer
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <Clock className="h-4 w-4" />
                      Latency: {event.processing_time_ms.toFixed(0)}ms
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm leading-relaxed font-medium">
                        {event.ai_summary || "Neural engine analysis completed. Site safety protocols verified against live imagery."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {event.detection_results?.detected_objects?.map((obj: any, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {obj.class_name} ({Math.round(obj.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Verification Verdict
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">Compliance Status:</span>
                        <div className={cn(
                          "flex items-center gap-2 font-black uppercase text-xs",
                          event.compliance_status ? "text-emerald-400" : "text-red-400"
                        )}>
                          {event.compliance_status ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                          {event.compliance_status ? "Fully Compliant" : "Safety Violation"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">Assessed Risk:</span>
                        <RiskBadge level={event.risk_score} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Decision Support Card */}
            <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <Zap className="h-24 w-24 text-white" />
              </div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black text-white tracking-tighter">Site Action</h3>
                <p className="text-blue-100 text-xs font-medium leading-relaxed">
                  {event?.compliance_status
                    ? "No corrective measures required. Compliance targets achieved."
                    : "Immediate safety intervention recommended. Notify zone supervisor."}
                </p>
                <button className={cn(
                  "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                  event?.compliance_status
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white text-blue-600 hover:bg-slate-100 shadow-xl"
                )}>
                  {event?.compliance_status ? "Log Entry" : "Escalate Violation"}
                </button>
              </div>
            </div>

            {/* Dynamic Violation breakdown */}
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                  <History className="h-5 w-5 text-slate-400" />
                  Detection Log
                </h3>
              </div>

              <div className="space-y-4">
                {!event ? (
                  <div className="py-20 text-center opacity-30">
                    <Cpu className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Analysis</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {event.compliance_status ? (
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-emerald-100">Clean Session</p>
                          <p className="text-[10px] text-emerald-400/70 font-black uppercase">Standard Compliance</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {event.detection_results?.detected_objects?.map((obj: any, i: number) => (
                          <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <div>
                                <p className="text-sm font-bold text-white">{obj.class_name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confidence: {Math.round(obj.confidence * 100)}%</p>
                              </div>
                            </div>
                            <Info className="h-4 w-4 text-slate-700" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-6 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Site Parameters</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                          <p className="text-[9px] font-black text-slate-600 uppercase">Zone</p>
                          <p className="text-xs font-bold text-slate-300">{event.zone_name || "Main Site"}</p>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                          <p className="text-[9px] font-black text-slate-600 uppercase">Engine</p>
                          <p className="text-xs font-bold text-slate-300">YOLOv8x</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
