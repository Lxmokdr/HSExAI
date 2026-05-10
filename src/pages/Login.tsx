import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.username.trim(), formData.password.trim());
      toast.success("Security Clearance Granted");
    } catch (error: any) {
      toast.error(error.message || "Access Denied: Invalid Credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-[3rem] p-12 shadow-2xl shadow-emerald-950/20">
          {/* Branding Section */}
          <div className="text-center space-y-4 mb-12">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 shadow-xl shadow-emerald-600/20 mb-6"
            >
              <Shield className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none">
              GUARDIAN<br/>VISION
            </h1>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xs">
              Industrial Safety Intelligence
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-5 top-5 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Operator ID / Username"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-5 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  placeholder="Access Key / Password"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-3",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Initialize System <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-800/50 text-center">
            <div className="flex items-center justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Link v3.0</span>
               <div className="h-1 w-1 rounded-full bg-slate-700" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ISO 45001 Compliant</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
            Authorized Personnel Access Only · © 2026 Guardian Vision AI
          </p>
        </div>
      </motion.div>
    </div>
  );
}

